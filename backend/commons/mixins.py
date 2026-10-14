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
