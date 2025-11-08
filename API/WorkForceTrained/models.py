from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class District(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

class Organization(models.Model):
    name = models.CharField(max_length=200)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.name


class Facility(models.Model):
    FACILITY_TYPES = [
        ("clinic", "Clinic"),
        ("health_center", "Health Centre"),
        ("district_hospital", "District Hospital"),
        ("central_hospital", "Central Hospital"),
        ("private", "Private Facility"),
    ]

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    facility_type = models.CharField(max_length=30, choices=FACILITY_TYPES)
    district = models.ForeignKey(District, on_delete=models.PROTECT, related_name="facilities")
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ["district__name", "name"]
        unique_together = ("name", "district")

    def __str__(self):
        return f"{self.name} ({self.district.name})"


class Competency(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.name}"

class HealthcareWorker(models.Model):
    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        
    ]

    national_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, db_index=True)
    email = models.EmailField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    disability = models.BooleanField(default=False)
    language = models.CharField(max_length=50, default="Chichewa/English")
    position = models.CharField(max_length=120, blank=True)
    is_active = models.BooleanField(default=True)

    facility = models.ForeignKey(
        Facility, on_delete=models.SET_NULL, null=True, blank=True, related_name="healthcare_workers"
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name="healthcare_workers"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["phone"]),
            models.Index(fields=["last_name", "first_name"]),
        ]
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Training(models.Model):
    hcw = models.ForeignKey(HealthcareWorker, on_delete=models.CASCADE, related_name="trainings")
    competency = models.ForeignKey(Competency, on_delete=models.PROTECT)
    provider = models.CharField(max_length=200, blank=True)
    date_completed = models.DateField()
    valid_until = models.DateField(blank=True, null=True)
    certificate_file = models.FileField(upload_to="certificates/", blank=True, null=True)

    class Meta:
        ordering = ["-date_completed"]
        unique_together = ("hcw", "competency", "date_completed")

    def __str__(self):
        return f"{self.hcw} - {self.competency.name}"


class AvailabilityRecord(models.Model):
    STATUS_CHOICES = [
        ("available", "Available"),
        ("unavailable", "Unavailable"),
        ("deployed", "Deployed"),
        ("on_leave", "On Leave"),
    ]

    hcw = models.ForeignKey(HealthcareWorker, on_delete=models.CASCADE, related_name="availability_records")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    note = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.hcw} - {self.status}"


class Deployment(models.Model):
    OUTBREAK_TYPES = [
        ("COVID-19", "COVID-19"),
        ("Cholera", "Cholera"),
        ("Polio", "Polio"),
        ("Ebola", "Ebola"),
        ("Other", "Other"),
    ]

    hcw = models.ForeignKey(HealthcareWorker, on_delete=models.CASCADE, related_name="deployments")
    district = models.ForeignKey(District, on_delete=models.PROTECT)
    outbreak_type = models.CharField(max_length=50, choices=OUTBREAK_TYPES)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    role = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=50, default="ongoing")
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.hcw} - {self.outbreak_type} ({self.status})"

class CovidSnapshot(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=100, default="disease.sh")
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True)

    cases = models.IntegerField(null=True)
    today_cases = models.IntegerField(null=True)
    deaths = models.IntegerField(null=True)
    today_deaths = models.IntegerField(null=True)
    recovered = models.IntegerField(null=True)
    active = models.IntegerField(null=True)
    raw = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        label = self.district.name if self.district else "Malawi (National)"
        return f"{label} @ {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
