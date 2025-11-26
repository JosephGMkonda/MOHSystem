from django.contrib import admin
from .models import (
    District, Organization, Facility, Competency,
    HealthcareWorker, Training, AvailabilityRecord,
    Deployment
)

@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ("code", "name")
    search_fields = ("name", "code")
    ordering = ("name",)

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "contact_email", "contact_phone")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ("name", "facility_type", "district", "organization")
    list_filter = ("facility_type", "district")
    search_fields = ("name", "code")
    ordering = ("district__name", "name")


@admin.register(Competency)
class CompetencyAdmin(admin.ModelAdmin):
    list_display = ("code", "name")
    search_fields = ("code", "name")
    ordering = ("code",)

@admin.register(HealthcareWorker)
class HealthcareWorkerAdmin(admin.ModelAdmin):
    list_display = (
        "first_name", "last_name", "phone", "facility", "organization",
        "position", "gender", "is_active"
    )
    list_filter = ("is_active", "gender", "facility__district", "organization")
    search_fields = ("first_name", "last_name", "phone", "national_id")
    ordering = ("last_name", "first_name")
    autocomplete_fields = ("facility", "organization")
    
@admin.register(Training)
class TrainingAdmin(admin.ModelAdmin):
    list_display = ("hcw", "competency", "provider", "date_completed", "valid_until")
    list_filter = ("competency", "provider")
    search_fields = ("hcw__first_name", "hcw__last_name", "competency__name")
    autocomplete_fields = ("hcw", "competency")
    date_hierarchy = "date_completed"



@admin.register(AvailabilityRecord)
class AvailabilityRecordAdmin(admin.ModelAdmin):
    list_display = ("hcw", "status", "location", "timestamp")
    list_filter = ("status",)
    search_fields = ("hcw__first_name", "hcw__last_name", "hcw__phone")
    autocomplete_fields = ("hcw",)
    date_hierarchy = "timestamp"

@admin.register(Deployment)
class DeploymentAdmin(admin.ModelAdmin):
    list_display = (
        "hcw", "district", "outbreak_type", "role",
        "start_date", "end_date", "status"
    )
    list_filter = ("outbreak_type", "status", "district")
    search_fields = ("hcw__first_name", "hcw__last_name", "role")
    autocomplete_fields = ("hcw", "district")
    date_hierarchy = "start_date"



