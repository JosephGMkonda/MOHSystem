from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import traceback
from WorkForceTrained.analytics import get_healthcare_data_summary
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Prefetch, OuterRef, Subquery
from django.http import HttpResponse
from rest_framework.pagination import PageNumberPagination
import csv
from io import StringIO, BytesIO
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from django.db.models import Q
from django.utils.timezone import localtime
from django.db import transaction



from .models import (
    District, Organization, Facility, Competency,
    HealthcareWorker, Training, AvailabilityRecord,
    Deployment, DeploymentHistory
)
from .serializers import (
    DistrictSerializer, OrganizationSerializer, FacilitySerializer,DeploymentWizardRequestSerializer,
    CompetencySerializer, HealthcareWorkerSerializer, TrainingSerializer,
    AvailabilityRecordSerializer, DeploymentSerializer, DeploymentCandidateSerializer,DeploymentHistorySerializer
)


class DistrictViewSet(viewsets.ModelViewSet):
    queryset = District.objects.all()
    serializer_class = DistrictSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "code"]


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]


class FacilityViewSet(viewsets.ModelViewSet):
    queryset = Facility.objects.select_related("district", "organization").only(
        'id','name','code','facility_type','district_id','organization_id'
    )
    serializer_class = FacilitySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["facility_type", "district"]
    search_fields = ["name", "code"]


class CompetencyViewSet(viewsets.ModelViewSet):
    queryset = Competency.objects.all()
    serializer_class = CompetencySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "code"]


class HealthcareWorkerPagination(PageNumberPagination):
    page_size = 10         
    page_size_query_param = 'page_size'
    max_page_size = 50


class HealthcareWorkerViewSet(viewsets.ModelViewSet):

    queryset =  (
        HealthcareWorker.objects.select_related
        ("facility", "facility__district","organization")
        .only('id','national_id','first_name','last_name','phone','email','gender',
              'disability','language','position','is_active','facility_id','organization_id',
              'created_at','updated_at')
        )
    serializer_class = HealthcareWorkerSerializer
    pagination_class = HealthcareWorkerPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["facility__district", "organization", "is_active", "gender"]
    search_fields = ["first_name", "last_name", "phone", "national_id"]
    ordering_fields = ["last_name", "first_name", "updated_at"]
    ordering = ["last_name"]

class DeploymentHistoryViewSet(viewsets.ModelViewSet):
    queryset = DeploymentHistory.objects.all()
    serializer_class = DeploymentHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["outbreak_type", "district_name"]
    search_fields = ["hcw_name", "deployment_name"]
    

class TrainingViewSet(viewsets.ModelViewSet):
    queryset = Training.objects.select_related("hcw", "competency")
    serializer_class = TrainingSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["competency", "hcw"]
    search_fields = ["provider", "hcw__first_name", "hcw__last_name"]


class AvailabilityRecordViewSet(viewsets.ModelViewSet):
    queryset = AvailabilityRecord.objects.select_related("hcw")
    serializer_class = AvailabilityRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["status"]
    search_fields = ["hcw__first_name", "hcw__last_name", "hcw__phone"]


class DeploymentViewSet(viewsets.ModelViewSet):
    queryset = Deployment.objects.filter(status="active")  # Only show active deployments
    serializer_class = DeploymentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["outbreak_type", "status", "district"]
    search_fields = ["hcw__first_name", "hcw__last_name", "role"]

    @action(detail=False, methods=['get'])
    def active_count(self, request):
        """
        Get count of active deployments
        """
        try:
            count = Deployment.objects.filter(status="active").count()
            return Response({'active_count': count})
        except Exception as e:
            return Response(
                {'error': str(e), 'detail': 'Failed to get active count'},
                status=500
            )

    @action(detail=False, methods=['post'])
    def archive_all(self, request):
        """
        Archive all active deployments and move to history
        """
        try:
            completion_notes = request.data.get('completion_notes', '')
            archived_by = request.user if request.user.is_authenticated else None
            
            # Get all active deployments
            active_deployments = Deployment.objects.filter(status="active")
            
            archived_count = 0
            with transaction.atomic():  # Ensure all or nothing
                for deployment in active_deployments:
                    # Create history record
                    DeploymentHistory.objects.create(
                        hcw_name=f"{deployment.hcw.first_name} {deployment.hcw.last_name}",
                        hcw_phone=deployment.hcw.phone,
                        hcw_email=deployment.hcw.email,
                        hcw_position=deployment.hcw.position,
                        district_name=deployment.district.name,
                        outbreak_type=deployment.outbreak_type,
                        start_date=deployment.start_date,
                        end_date=deployment.end_date,
                        role=deployment.role,
                        deployment_name=deployment.deployment_name,
                        urgency=deployment.urgency,
                        notes=deployment.notes,
                        original_deployment_id=deployment.id,
                        archived_by=archived_by,
                        completion_notes=completion_notes
                    )
                    
                    # Update deployment status to 'archived'
                    deployment.status = "archived"
                    deployment.save()
                    archived_count += 1

            return Response({
                'message': f'Successfully archived {archived_count} deployments',
                'archived_count': archived_count
            })
            
        except Exception as e:
            return Response(
                {'error': str(e), 'detail': 'Failed to archive deployments'},
                status=400
            )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get deployment statistics
        """
        try:
            active_count = Deployment.objects.filter(status="active").count()
            archived_count = Deployment.objects.filter(status="archived").count()
            total_count = Deployment.objects.count()
            
            return Response({
                'active_count': active_count,
                'archived_count': archived_count,
                'total_count': total_count
            })
        except Exception as e:
            return Response(
                {'error': str(e), 'detail': 'Failed to get deployment stats'},
                status=500
            )


@api_view(["GET"])
def healthcare_dashboard_data(request):
    
    filters = {
        'district': request.GET.get('district'),
        'gender': request.GET.get('gender'),
        'organization': request.GET.get('organization'),
        'facility_type': request.GET.get('facility_type'),
    }
    
    
    filters = {k: v for k, v in filters.items() if v is not None and v != ''}
    
    print(f"Received filters: {filters}")  
    
    try:
        data = get_healthcare_data_summary(filters)
        return Response(data)
    except Exception as e:
        print(f"Error in healthcare_dashboard_data: {str(e)}")
        print(traceback.format_exc())  # Full stack trace
        return Response(
            {
                "error": "Failed to fetch dashboard data",
                "details": str(e),
                "stack_trace": traceback.format_exc(),
                "received_filters": filters
            },
            status=500
        )

        
@api_view(["GET"])
def deployment_search(request):
    district = request.GET.get("district")
    competency = request.GET.get("competency")
    position = request.GET.get("position")
    needed = int(request.GET.get("needed", 10))

    workers = HealthcareWorker.objects.filter(is_active=True)

    if district:
        workers = workers.filter(facility__district_id=district)

    if position:
        workers = workers.filter(position__icontains=position)

    if competency:
        workers = workers.filter(competencies__id=competency).distinct()

    
    workers = workers.order_by("first_name")[:needed]

    serializer = HealthcareWorkerSerializer(workers, many=True)
    return Response(serializer.data)