from datetime import date
from decimal import Decimal

from django.db.models import Sum, Count
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth

from billing.models import CommissionEntry
from billing.constants import CommissionEntryStatus
from .utils import resolve_branch_ids


_TRUNC_MAP = {
    "day": TruncDay,
    "week": TruncWeek,
    "month": TruncMonth,
}


def get_commissions_paid(user, start_date: date, end_date: date, granularity: str = "day", branch_id=None) -> dict:
    """Commissions paid out, bucketed by the day they were paid (not earned)."""
    branch_ids = resolve_branch_ids(user, branch_id)

    qs = CommissionEntry.objects.filter(
        branch__in=branch_ids,
        status=CommissionEntryStatus.PAID,
        paid_at__date__range=(start_date, end_date),
    )

    total = qs.aggregate(total=Sum("amount"))["total"] or Decimal("0")

    TruncFn = _TRUNC_MAP.get(granularity, TruncDay)
    time_series = (
        qs.annotate(period=TruncFn("paid_at"))
        .values("period")
        .annotate(total=Sum("amount"), count=Count("id"))
        .order_by("period")
    )

    return {
        "total": total,
        "time_series": [
            {
                "period": row["period"].date().isoformat() if hasattr(row["period"], "date") else str(row["period"]),
                "total": row["total"],
                "count": row["count"],
            }
            for row in time_series
        ],
    }
