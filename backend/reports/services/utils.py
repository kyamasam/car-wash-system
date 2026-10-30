from django.db.models import Q

from billing.constants import CommissionEntryStatus
from commons.models import Branch


def exclude_deleted_job_commissions(qs):
    """
    Drop commissions tied to soft-deleted jobs, except ones already paid out
    (that money has left the business, so it still counts).
    """
    return qs.exclude(Q(job__deleted_at__isnull=False) & ~Q(status=CommissionEntryStatus.PAID))


def resolve_branch_ids(user, branch_id_param=None):
    """
    Returns a list of branch IDs to scope a report query.
    Superusers bypass all scoping. Branch-scoped users (Attendant/Cashier)
    are restricted to their own branch regardless of any param.
    Business-level users (Owner/Manager) may optionally filter to a single branch.
    """
    if user.is_superuser:
        if branch_id_param:
            return [branch_id_param]
        return list(Branch.objects.values_list("id", flat=True))

    if user.branch_id:
        return [user.branch_id]

    # Business-level user
    qs = Branch.objects.filter(business=user.business_id)
    if branch_id_param:
        qs = qs.filter(id=branch_id_param)
    return list(qs.values_list("id", flat=True))


def parse_date(value, fallback):
    from datetime import date
    if not value:
        return fallback
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        return fallback


def current_month_start():
    from datetime import date
    today = date.today()
    return date(today.year, today.month, 1)
