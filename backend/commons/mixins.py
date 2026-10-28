from django.db.models import Q


class BranchScopedMixin:
    """
    Filters querysets to the logged-in user's branch.
    - Superusers see everything.
    - Users with a branch see only records for that branch.
    - Users without a branch (business-level) see records for all branches in their business.

    Override `branch_lookup_field` when the model reaches Branch indirectly
    (e.g. "job__branch" for JobItem).
    """

    branch_lookup_field = "branch"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated or user.is_superuser:
            return qs
        if user.branch_id:
            return qs.filter(**{self.branch_lookup_field: user.branch_id})
        return qs.filter(**{f"{self.branch_lookup_field}__business": user.business_id})


class BusinessScopedMixin:
    """
    Filters querysets to the logged-in user's business.
    - Superusers see everything.
    - Users see only records for their business.
    - Users with a branch additionally only see records for their branch or
      records shared by all branches (branch is NULL).
    """

    business_lookup_field = "business"
    branch_lookup_field = "branch"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated or user.is_superuser:
            return qs
        qs = qs.filter(**{self.business_lookup_field: user.business_id})
        if user.branch_id:
            qs = qs.filter(
                Q(**{f"{self.branch_lookup_field}__isnull": True})
                | Q(**{self.branch_lookup_field: user.branch_id})
            )
        return qs
