from rest_framework.permissions import SAFE_METHODS, BasePermission

from subscriptions.exceptions import SubscriptionExpired
from subscriptions.services.subscription import get_expiry, is_active
from users.constants import UserRole

SUBSCRIPTION_MANAGER_ROLES = {UserRole.OWNER, UserRole.MANAGER}


class HasActiveSubscription(BasePermission):
    """
    Read-only mode for businesses whose subscription has expired: safe methods
    always pass, writes raise SubscriptionExpired (HTTP 402).

    Registered in REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"]. A view that sets its
    own `permission_classes` replaces the defaults, so it must list this class
    explicitly to stay guarded. Set `subscription_exempt = True` on a view to skip it.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS or getattr(view, "subscription_exempt", False):
            return True
        user = request.user
        if not user or not user.is_authenticated or user.is_superuser or not user.business_id:
            return True
        if is_active(user.business_id):
            return True
        raise SubscriptionExpired(get_expiry(user.business_id))


class CanManageSubscription(BasePermission):
    """Owners and managers of a business can pay for and view billing history."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return bool(user.business_id) and user.role in SUBSCRIPTION_MANAGER_ROLES
