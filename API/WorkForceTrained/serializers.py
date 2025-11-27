from rest_framework import serializers
from django.utils.timezone import localtime


from .models import (
    District, Organization, Facility, Competency,
    HealthcareWorker, Training, AvailabilityRecord,
    Deployment,DeploymentHistory
)


class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = "__all__"


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = "__all__"

class FacilitySerializer(serializers.ModelSerializer):
    district = DistrictSerializer(read_only=True)
    district_name = serializers.CharField(source="district.name", read_only=True)
    district_id = serializers.PrimaryKeyRelatedField( source="district", queryset=District.objects.all(), write_only=True )

    class Meta:
        model = Facility
        fields = [
            "id", "name", "code", "facility_type",
            "district", "district_id", "district_name","organization"
        ]



class CompetencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Competency
        fields = "__all__"

class HealthcareWorkerSerializer(serializers.ModelSerializer):
    facility_details = FacilitySerializer(source="facility", read_only=True)
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    

    

    class Meta:
        model = HealthcareWorker
        fields = [
            "id", "national_id", "first_name", "last_name", "phone", "email",
            "gender", "disability", "language", "position", "is_active",
            "facility","facility_details","organization", "organization_name",
            "created_at", "updated_at"
        ]
        extra_kwargs = {'facility': {'write_only': False}}

    def validate_facility_id(self, value):
        if not value:
            raise serializers.ValidationError("Facility is required.")
        return value

   

class TrainingSerializer(serializers.ModelSerializer):
    hcw_name = serializers.CharField(source="hcw.__str__", read_only=True)
    competency_name = serializers.CharField(source="competency.name", read_only=True)

    class Meta:
        model = Training
        fields = [
            "id", "hcw", "hcw_name", "competency", "competency_name",
            "provider", "date_completed", "valid_until", "certificate_file"
        ]


class AvailabilityRecordSerializer(serializers.ModelSerializer):
    hcw_name = serializers.CharField(source="hcw.__str__", read_only=True)

    class Meta:
        model = AvailabilityRecord
        fields = [
            "id", "hcw", "hcw_name", "status", "note", "location", "timestamp"
        ]


class DeploymentSerializer(serializers.ModelSerializer):
    hcw_name = serializers.CharField(source="hcw.__str__", read_only=True)
    district_name = serializers.CharField(source="district.name", read_only=True)

    hcw = HealthcareWorkerSerializer(read_only=True)

    class Meta:
        model = Deployment
        fields = [
            "id", "hcw", "hcw_name", "district", "district_name",
            "outbreak_type", "start_date", "end_date", "role",
            "status", "notes"
        ]
class DeploymentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DeploymentHistory
        fields = "__all__"






class DeploymentWizardRequestSerializer(serializers.Serializer):
    district_id = serializers.PrimaryKeyRelatedField(
        queryset=District.objects.all(), 
        required=True
    )
    outbreak_type = serializers.ChoiceField(choices=Deployment.OUTBREAK_TYPES)
    number_of_workers = serializers.IntegerField(min_value=1, max_value=100)
    required_positions = serializers.ListField(
        child=serializers.CharField(max_length=120),
        required=False
    )
    required_competencies = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Competency.objects.all()),
        required=False
    )
    start_date = serializers.DateField(required=True)
    estimated_duration_days = serializers.IntegerField(min_value=1, max_value=365, default=30)






class HealthcareWorkerTableSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source="facility.name", read_only=True)
    district_name = serializers.CharField(source="facility.district.name", read_only=True)
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    competencies = serializers.SerializerMethodField()
    latest_availability = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = HealthcareWorker
        fields = [
            "id", "full_name", "national_id", "phone", "email",
            "gender", "position", "is_active",
            "facility_name", "district_name", "organization_name",
            "competencies", "latest_availability", "match_score",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_competencies(self, obj):
        
        trainings = getattr(obj, "prefetched_trainings", None)
        if trainings is None:
            trainings = obj.trainings.all().select_related("competency")
        names = []
        for t in trainings:
            if t.competency and t.competency.name not in names:
                names.append(t.competency.name)
        return names

    def get_latest_availability(self, obj):
    
        latest = getattr(obj, "latest_availability", None)
        if latest:
            return latest
        rec = obj.availability_records.order_by("-timestamp").first()
        if not rec:
            return None
    
        ts = rec.timestamp
        return {"status": rec.status, "timestamp": localtime(ts).isoformat() if ts else None, "note": rec.note}

    def get_match_score(self, obj):
        
        requested_competency_id = self.context.get("requested_competency_id")
        score = 0
        
        if requested_competency_id:
            if obj.trainings.filter(competency_id=requested_competency_id).exists():
                score += 70
    
        latest = obj.availability_records.order_by("-timestamp").first()
        if latest and latest.status == "available":
            score += 30
    
        return min(100, score)
class DeploymentCandidateSerializer(HealthcareWorkerTableSerializer):
    
    distance_from_outbreak = serializers.SerializerMethodField()
    deployment_readiness = serializers.SerializerMethodField()
    
    class Meta(HealthcareWorkerTableSerializer.Meta):
        fields = HealthcareWorkerTableSerializer.Meta.fields + [
            'distance_from_outbreak', 'deployment_readiness'
        ]
    
    def get_distance_from_outbreak(self, obj):
    
        outbreak_district = self.context.get('outbreak_district')
        if obj.facility and obj.facility.district == outbreak_district:
            return "Same District"
        return "Different District"
    
    def get_deployment_readiness(self, obj):

        score = self.get_match_score(obj)
        if score >= 80:
            return "High"
        elif score >= 50:
            return "Medium"
        return "Low"