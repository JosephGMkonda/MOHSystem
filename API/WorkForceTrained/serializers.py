from rest_framework import serializers
from .models import (
    District, Organization, Facility, Competency,
    HealthcareWorker, Training, AvailabilityRecord,
    Deployment, CovidSnapshot
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
    district_id = serializers.PrimaryKeyRelatedField(
        source="district", queryset=District.objects.all(), write_only=True
    )

    class Meta:
        model = Facility
        fields = [
            "id", "name", "code", "facility_type",
            "district", "district_id", "organization"
        ]



class CompetencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Competency
        fields = "__all__"

class HealthcareWorkerSerializer(serializers.ModelSerializer):
    facility = FacilitySerializer(read_only=True)
    facility_id = serializers.PrimaryKeyRelatedField(
        source="facility", queryset=Facility.objects.all(),
        write_only=True, required=False, allow_null=True
    )
    organization_name = serializers.CharField(source="organization.name", read_only=True)

    class Meta:
        model = HealthcareWorker
        fields = [
            "id", "national_id", "first_name", "last_name", "phone", "email",
            "gender", "disability", "language", "position", "is_active",
            "facility", "facility_id", "organization", "organization_name",
            "created_at", "updated_at"
        ]


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

    class Meta:
        model = Deployment
        fields = [
            "id", "hcw", "hcw_name", "district", "district_name",
            "outbreak_type", "start_date", "end_date", "role",
            "status", "notes"
        ]


class CovidSnapshotSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source="district.name", read_only=True)

    class Meta:
        model = CovidSnapshot
        fields = "__all__"
