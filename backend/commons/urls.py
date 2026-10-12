from rest_framework.routers import DefaultRouter

from commons.views import BusinessViewSet, BranchViewSet

router = DefaultRouter()
router.register("businesses", BusinessViewSet, basename="business")
router.register("branches", BranchViewSet, basename="branch")

url_patterns = router.urls
