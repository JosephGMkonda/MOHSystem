from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import traceback
from WorkForceTrained.analytics import get_healthcare_data_summary
from .models import (
    District, Organization, Facility, Competency,
    HealthcareWorker, Training, AvailabilityRecord,
    Deployment, CovidSnapshot
)
from .serializers import (
    DistrictSerializer, OrganizationSerializer, FacilitySerializer,
    CompetencySerializer, HealthcareWorkerSerializer, TrainingSerializer,
    AvailabilityRecordSerializer, DeploymentSerializer, CovidSnapshotSerializer
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
    queryset = Facility.objects.select_related("district", "organization")
    serializer_class = FacilitySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["facility_type", "district"]
    search_fields = ["name", "code"]


class CompetencyViewSet(viewsets.ModelViewSet):
    queryset = Competency.objects.all()
    serializer_class = CompetencySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "code"]


class HealthcareWorkerViewSet(viewsets.ModelViewSet):
    queryset = HealthcareWorker.objects.select_related("facility", "organization")
    serializer_class = HealthcareWorkerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["facility__district", "organization", "is_active", "gender"]
    search_fields = ["first_name", "last_name", "phone", "national_id"]
    ordering_fields = ["last_name", "first_name", "updated_at"]
    ordering = ["last_name"]


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
    queryset = Deployment.objects.select_related("hcw", "district")
    serializer_class = DeploymentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["outbreak_type", "status", "district"]
    search_fields = ["hcw__first_name", "hcw__last_name", "role"]


class CovidSnapshotViewSet(viewsets.ModelViewSet):
    queryset = CovidSnapshot.objects.select_related("district")
    serializer_class = CovidSnapshotSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["district", "source"]
    ordering_fields = ["timestamp"]
    ordering = ["-timestamp"]





@api_view(["GET"])
def healthcare_dashboard_data(request):
    """
    Healthcare dashboard data with filter support
    """
    # Extract filter parameters from request
    filters = {
        'district': request.GET.get('district'),
        'gender': request.GET.get('gender'),
        'organization': request.GET.get('organization'),
        'facility_type': request.GET.get('facility_type'),
    }
    
    # Remove None values and empty strings
    filters = {k: v for k, v in filters.items() if v is not None and v != ''}
    
    print(f"Received filters: {filters}")  # Debug
    
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
