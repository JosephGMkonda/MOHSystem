import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from faker import Faker
from WorkForceTrained.models import (
    HealthcareWorker, District, Organization, Facility, Competency,
    Training, AvailabilityRecord
)

fake = Faker()

class Command(BaseCommand):
    help = "Seed 20 random healthcare workers distributed across Malawi"

    def handle(self, *args, **options):
        self.stdout.write("🌍 Seeding 20 random healthcare workers...")

        facilities = list(Facility.objects.all())
        organizations = list(Organization.objects.all())
        competencies = list(Competency.objects.all())

        if not facilities or not organizations or not competencies:
            self.stdout.write(self.style.ERROR("❌ Missing prerequisite data (facilities, orgs, or competencies). Run `seed_initial_data` first."))
            return

        genders = ["male", "female"]
        positions = ["Nurse", "Clinician", "Medical Assistant", "Lab Technician", "Health Surveillance Assistant", "Doctor"]

        for i in range(20):
            first_name = fake.first_name()
            last_name = fake.last_name()
            gender = random.choice(genders)
            national_id = f"MW{random.randint(100000, 999999)}"
            phone = f"+265{random.randint(880000000, 999999999)}"
            email = f"{first_name.lower()}.{last_name.lower()}@example.com"

            facility = random.choice(facilities)
            organization = random.choice(organizations)

            worker = HealthcareWorker.objects.create(
                national_id=national_id,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                email=email,
                gender=gender,
                disability=random.choice([True, False, False]),  # few disabled
                language=random.choice(["Chichewa/English", "Chichewa", "English"]),
                position=random.choice(positions),
                facility=facility,
                organization=organization,
                is_active=True,
            )

            # Assign random 1–3 competencies
            selected_comps = random.sample(competencies, k=random.randint(1, 3))
            for comp in selected_comps:
                Training.objects.create(
                    hcw=worker,
                    competency=comp,
                    provider=random.choice(["Ministry of Health", "CHAM", "Partners in Health"]),
                    date_completed=date(2020, random.randint(1, 12), random.randint(1, 28)),
                    valid_until=date(2025, random.randint(1, 12), random.randint(1, 28)),
                )

            # Availability record (all "available")
            AvailabilityRecord.objects.create(
                hcw=worker,
                status="available",
                note=f"Available for deployment in {facility.district.name}.",
                location=facility.district.name,
            )

            self.stdout.write(f"✅ Created worker: {worker.first_name} {worker.last_name} ({facility.district.name})")

        self.stdout.write(self.style.SUCCESS("🎉 Successfully seeded 20 healthcare workers!"))
