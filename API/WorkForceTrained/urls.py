from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DistrictViewSet, OrganizationViewSet, FacilityViewSet, CompetencyViewSet,
    HealthcareWorkerViewSet, TrainingViewSet, AvailabilityRecordViewSet,
    DeploymentViewSet, CovidSnapshotViewSet
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
router.register(r"covid", CovidSnapshotViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
