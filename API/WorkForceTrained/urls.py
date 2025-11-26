from django.urls import path, include
from .views import healthcare_dashboard_data
from rest_framework.routers import DefaultRouter
from .views import (
    DistrictViewSet, OrganizationViewSet, FacilityViewSet, CompetencyViewSet,
    HealthcareWorkerViewSet, TrainingViewSet, AvailabilityRecordViewSet,
    DeploymentViewSet,DeploymentHistoryViewSet
)

router = DefaultRouter()
router.register(r"districts", DistrictViewSet)
router.register(r"organizations", OrganizationViewSet)
router.register(r"facilities", FacilityViewSet)
router.register(r"competencies", CompetencyViewSet)
router.register(r"hcws", HealthcareWorkerViewSet)
router.register(r"trainings", TrainingViewSet)
router.register(r"availability", AvailabilityRecordViewSet)
router.register(r"deployments", DeploymentViewSet)
router.register(r"deployment-history", DeploymentHistoryViewSet)



urlpatterns = [
    path("", include(router.urls)),
    path('dashboard/summary/', healthcare_dashboard_data, name='dashboard-summary'),
]
