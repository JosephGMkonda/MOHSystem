from django.core.management.base import BaseCommand
from WorkForceTrained.models import District, Organization, Facility, Competency

class Command(BaseCommand):
    help = "Seed initial fallback data for Districts, Organizations, Facilities, and Competencies"

    def handle(self, *args, **options):
        self.stdout.write(" Seeding initial data...")
        districts_data = [
            {"name": "Chitipa", "code": "CT"},
    {"name": "Karonga", "code": "KR"},
    {"name": "Rumphi", "code": "RP"},
    {"name": "Mzimba", "code": "MZ"},
    {"name": "Nkhata Bay", "code": "NB"},
    {"name": "Likoma", "code": "LK"},

    # Central Region
    {"name": "Kasungu", "code": "KS"},
    {"name": "Nkhotakota", "code": "NK"},
    {"name": "Ntchisi", "code": "NT"},
    {"name": "Dowa", "code": "DW"},
    {"name": "Salima", "code": "SA"},
    {"name": "Lilongwe", "code": "LL"},
    {"name": "Mchinji", "code": "MC"},
    {"name": "Dedza", "code": "DZ"},
    {"name": "Ntcheu", "code": "NE"},

    # Southern Region
    {"name": "Mangochi", "code": "MG"},
    {"name": "Machinga", "code": "MH"},
    {"name": "Zomba", "code": "ZB"},
    {"name": "Chiradzulu", "code": "CZ"},
    {"name": "Blantyre", "code": "BL"},
    {"name": "Mwanza", "code": "MW"},
    {"name": "Thyolo", "code": "TH"},
    {"name": "Mulanje", "code": "MU"},
    {"name": "Phalombe", "code": "PH"},
    {"name": "Chikwawa", "code": "CK"},
    {"name": "Nsanje", "code": "NS"},
    {"name": "Balaka", "code": "BA"},
    {"name": "Neno", "code": "NN"},
]


        for data in districts_data:
            district, created = District.objects.get_or_create(code=data["code"], defaults={"name": data["name"]})
            if created:
                self.stdout.write(f"✅ Created district: {district.name}")
            else:
                self.stdout.write(f"↩️  District already exists: {district.name}")

        # --------------------
        # 2. Organizations
        # --------------------
        organizations_data = [
            {"name": "Ministry of Health"},
            {"name": "CHAM"},
            {"name": "Partners in Health"},
            {"name": "World Health Organization"},
        ]

        for data in organizations_data:
            org, created = Organization.objects.get_or_create(name=data["name"])
            if created:
                self.stdout.write(f"✅ Created organization: {org.name}")
            else:
                self.stdout.write(f"↩️  Organization already exists: {org.name}")

        # --------------------
        # 3. Competencies
        # --------------------
        competencies_data = [
            {"code": "IPC", "name": "Infection Prevention and Control"},
            {"code": "VAC", "name": "Vaccination Administration"},
            {"code": "CM", "name": "Case Management"},
            {"code": "TEST", "name": "COVID-19 Testing"},
            {"code": "TRACE", "name": "Contact Tracing"},
        ]

        for data in competencies_data:
            comp, created = Competency.objects.get_or_create(code=data["code"], defaults={"name": data["name"]})
            if created:
                self.stdout.write(f"✅ Created competency: {comp.name}")
            else:
                self.stdout.write(f"↩️  Competency already exists: {comp.name}")

        # --------------------
        # 4. Facilities
        # --------------------
        facilities_data = [
            {"name": "Kamuzu Central Hospital", "district_code": "LL", "facility_type": "central_hospital"},
            {"name": "Queen Elizabeth Central Hospital", "district_code": "BL", "facility_type": "central_hospital"},
            {"name": "Mzuzu Central Hospital", "district_code": "MZ", "facility_type": "central_hospital"},
            {"name": "Zomba Central Hospital", "district_code": "ZB", "facility_type": "central_hospital"},
            {"name": "Kasungu District Hospital", "district_code": "KS", "facility_type": "district_hospital"},
        ]

        for data in facilities_data:
            try:
                district = District.objects.get(code=data["district_code"])
            except District.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"❌ District not found for code {data['district_code']}"))
                continue

            facility, created = Facility.objects.get_or_create(
                name=data["name"],
                district=district,
                defaults={
                    "facility_type": data["facility_type"],
                    "organization": Organization.objects.filter(name="Ministry of Health").first()
                }
            )

            if created:
                self.stdout.write(f"✅ Created facility: {facility.name} ({district.name})")
            else:
                self.stdout.write(f"↩️  Facility already exists: {facility.name} ({district.name})")

        self.stdout.write(self.style.SUCCESS("🌿 Seeding complete!"))
