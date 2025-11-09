from django.db.models import Count, Q, F
from WorkForceTrained.models import District, Facility, HealthcareWorker, Organization, Training, Competency

def get_healthcare_data_summary(filters=None):
    """
    SIMPLIFIED VERSION - Basic filtering that works
    """
    if filters is None:
        filters = {}
    
    print(f"Applying filters: {filters}")
    
    # Build simple worker filters
    worker_filters = Q()
    
    if filters.get('district') and filters['district'] != 'all':
        worker_filters &= Q(facility__district__name=filters['district'])
    if filters.get('gender') and filters['gender'] != 'all':
        worker_filters &= Q(gender=filters['gender'])
    if filters.get('organization') and filters['organization'] != 'all':
        worker_filters &= Q(organization__name=filters['organization'])
    if filters.get('facility_type') and filters['facility_type'] != 'all':
        worker_filters &= Q(facility__facility_type=filters['facility_type'])
    
    # Apply filters to main counts
    total_workers = HealthcareWorker.objects.filter(worker_filters).count()
    active_workers = HealthcareWorker.objects.filter(worker_filters & Q(is_active=True)).count()
    
    # Simplified counts without complex filtering
    total_facilities = Facility.objects.count()
    total_organizations = Organization.objects.count()
    total_competencies = Competency.objects.count()
    total_trainings = Training.objects.count()
    
    # Basic data without complex filtered counts
    gender_data = (
        HealthcareWorker.objects
        .filter(worker_filters)
        .values('gender')
        .annotate(count=Count('id'))
        .order_by('gender')
    )

    # Simplified district data
    district_data = (
        District.objects
        .annotate(
            total_facilities=Count('facilities'),
            total_workers=Count('facilities__healthcare_workers'),
        )
        .values('name', 'code', 'total_facilities', 'total_workers')
        .order_by('name')
    )

    # Other basic data
    facility_data = (
        Facility.objects
        .values('facility_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    org_data = (
        Organization.objects
        .annotate(total_workers=Count('healthcare_workers'))
        .values('name', 'total_workers')
        .order_by('-total_workers')
    )

    competency_data = (
        Competency.objects
        .annotate(total_trainings=Count('training'))
        .values('code', 'name', 'total_trainings')
        .order_by('-total_trainings')
    )

    training_years = (
        Training.objects
        .annotate(year=F('date_completed__year'))
        .values('year')
        .annotate(count=Count('id'))
        .order_by('year')
    )

    disability_data = (
        HealthcareWorker.objects
        .filter(worker_filters)
        .values('disability')
        .annotate(count=Count('id'))
        .order_by('disability')
    )

    return {
        "summary": {
            "total_workers": total_workers,
            "active_workers": active_workers,
            "total_facilities": total_facilities,
            "total_organizations": total_organizations,
            "total_competencies": total_competencies,
            "total_trainings": total_trainings,
        },
        "gender_distribution": list(gender_data),
        "district_distribution": list(district_data),
        "facility_types": list(facility_data),
        "organization_distribution": list(org_data),
        "competency_popularity": list(competency_data),
        "training_timeline": list(training_years),
        "disability_stats": list(disability_data),
        "applied_filters": filters
    }