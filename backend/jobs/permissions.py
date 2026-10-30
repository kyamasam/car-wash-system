from rest_framework.permissions import BasePermission

from users.constants import UserRole


def can_manage_deleted_jobs(user):
    """Owners, managers and superusers may delete jobs and view deleted ones."""
    if not user or not user.is_authenticated:
        return False
    return user.is_superuser or user.role in (UserRole.OWNER, UserRole.MANAGER)


class CanDeleteJob(BasePermission):
    """Only owners, managers and superusers may delete jobs."""

    message = "Only owners and managers can delete jobs."

    def has_permission(self, request, view):
        return can_manage_deleted_jobs(request.user)
