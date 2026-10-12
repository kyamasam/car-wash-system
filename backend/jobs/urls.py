from rest_framework.routers import DefaultRouter
from jobs.views import JobViewSet, JobItemViewSet

router = DefaultRouter()
router.register("items", JobItemViewSet, basename="job-item")
router.register("", JobViewSet, basename="job")

url_patterns = router.urls
