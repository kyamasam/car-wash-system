from rest_framework.routers import DefaultRouter
from workers.views import WorkerViewSet

router = DefaultRouter()
router.register("", WorkerViewSet, basename="worker")

url_patterns = router.urls
