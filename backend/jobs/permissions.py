from rest_framework.permissions import BasePermission

from users.constants import UserRole


class CanDeleteJob(BasePermission):
    """Only owners, managers and superusers may delete jobs."""

    message = "Only owners and managers can delete jobs."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.is_superuser or user.role in (UserRole.OWNER, UserRole.MANAGER)
