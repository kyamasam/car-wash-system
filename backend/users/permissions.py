from rest_framework import permissions
from rest_framework.permissions import BasePermission


class OwnsUserProfile(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return view.action in ['retrieve', 'update', 'partial_update'] and obj.user.id == request.id or \
               request.user.is_superuser


class HasToOwnProfile(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return view.action in ['retrieve', 'update',
                               'partial_update', 'create'] \
               and obj.photographer_profile.user.id == request.user.id or request.user.is_superuser


class AnonCreateAndUpdateOwnerOnly(permissions.BasePermission):
    """
    Custom permission:
        - allow anonymous POST
        - allow authenticated GET and PUT on *own* record
        - allow all actions for superuser
    """

    def has_permission(self, request, view):
        return view.action == 'create' or request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return view.action in ['retrieve', 'update',
                               'partial_update'] and obj.id == request.user.id or request.user.is_superuser


class AuthenticatedCreateAndUpdateOwnerOnly(permissions.BasePermission):
    """
    Custom permission:
        - allow anonymous POST
        - allow authenticated GET and PUT on *own* record
        - allow all actions for staff
    """

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user or request.user.is_staff or request.user.is_superuser


class AnonReadAdminCreate(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff or request.user.is_superuser


class AdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return user.is_staff or user.is_superuser


class IsPlatformManagerOrAdmin(BasePermission):
    """Allow only PLATFORM_MANAGER or admin/staff users."""

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_staff or user.is_superuser:
            return True

        return getattr(user, "user_type", None) == "PLATFORM_MANAGER"


class IsOwner(permissions.BasePermission):
    """User owns the resource or is a superuser."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.is_superuser:
            return True
        return obj.career_profile.user == request.user


# ---------------------------------------------------------------------------
# Organisation-scoped permission classes
# ---------------------------------------------------------------------------
# Role hierarchy (highest → lowest): OWNER > ADMIN > DEVELOPER > TECHNICIAN > BILLING_MANAGER > VIEWER
#
# IsOrgOwner   — OWNER only
# IsOrgAdmin   — OWNER or ADMIN
# IsOrgViewer  — any active member, read-only (SAFE_METHODS)
# IsOrgMember  — any active member, all methods
#
# Usage in a viewset:
#   permission_classes = [IsAuthenticated, IsOrgAdmin]
# ---------------------------------------------------------------------------

def _get_member(user, organization):
    from users.models import OrganizationMember
    try:
        return OrganizationMember.objects.get(
            organization=organization,
            user=user,
            joined_at__isnull=False,
            left_at__isnull=True,
        )
    except OrganizationMember.DoesNotExist:
        return None


def _resolve_org(view):
    """Extract Organization from view kwargs (org_slug or slug)."""
    from users.models import Organization
    slug = view.kwargs.get("org_slug") or view.kwargs.get("slug")
    if slug:
        try:
            return Organization.objects.get(slug=slug, is_active=True, deleted_at__isnull=True)
        except Organization.DoesNotExist:
            return None
    return None


def _org_from_obj(obj):
    """Extract Organization from a model instance."""
    from users.models import Organization
    if isinstance(obj, Organization):
        return obj
    return getattr(obj, "organization", None)


class _OrgRoleBase(permissions.BasePermission):
    """
    Base for org-scoped role checks.

    Subclasses set:
      allowed_roles  — set of OrgRole values that pass, or None to allow any role
      safe_only      — if True, only SAFE_METHODS are permitted for non-superusers
    """
    allowed_roles: set | None = None
    safe_only: bool = False

    def _role_ok(self, member) -> bool:
        if member is None:
            return False
        if self.allowed_roles is None:
            return True
        return member.role in self.allowed_roles

    def _method_ok(self, request) -> bool:
        if not self.safe_only:
            return True
        return request.method in permissions.SAFE_METHODS

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if not self._method_ok(request):
            return False
        org = _resolve_org(view)
        if org is None:
            return True
        return self._role_ok(_get_member(request.user, org))

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        if not self._method_ok(request):
            return False
        org = _org_from_obj(obj)
        if org is None:
            return True
        return self._role_ok(_get_member(request.user, org))


class IsOrgOwner(_OrgRoleBase):
    """OWNER only — full access."""
    allowed_roles = {"OWNER"}


class IsOrgAdmin(_OrgRoleBase):
    """OWNER or ADMIN — full access."""
    allowed_roles = {"OWNER", "ADMIN"}


class IsOrgViewer(_OrgRoleBase):
    """Any active org member — read-only (SAFE_METHODS)."""
    allowed_roles = None   # any role is fine …
    safe_only = True       # … but writes are blocked


class IsOrgMember(_OrgRoleBase):
    """Any active org member — all methods."""
    allowed_roles = None
    safe_only = False