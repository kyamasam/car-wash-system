from rest_framework.routers import DefaultRouter
from services.views import ServiceViewSet, ServicePriceViewSet

router = DefaultRouter()
router.register("prices", ServicePriceViewSet, basename="service-price")
router.register("", ServiceViewSet, basename="service")

url_patterns = router.urls
