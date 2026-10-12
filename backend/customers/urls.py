from rest_framework.routers import DefaultRouter
from customers.views import CustomerViewSet, VehicleViewSet

router = DefaultRouter()
router.register("vehicles", VehicleViewSet, basename="vehicle")
router.register("", CustomerViewSet, basename="customer")

url_patterns = router.urls
