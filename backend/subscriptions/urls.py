from django.urls import path
from rest_framework.routers import DefaultRouter

from subscriptions.views import PackageViewSet, SubscriptionStatusView, SubscriptionViewSet, SubscriptionPaymentViewSet

router = DefaultRouter()
router.register("packages", PackageViewSet, basename="subscription-package")
router.register("payments", SubscriptionPaymentViewSet, basename="subscription-payment")
router.register("history", SubscriptionViewSet, basename="subscription")

url_patterns = [
    path("status/", SubscriptionStatusView.as_view(), name="subscription-status"),
    *router.urls,
]
