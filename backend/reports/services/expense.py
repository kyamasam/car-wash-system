from datetime import date
from decimal import Decimal

from django.db.models import Sum, Count
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth

from billing.models import Expense
from .utils import resolve_branch_ids


_TRUNC_MAP = {
    "day": TruncDay,
    "week": TruncWeek,
    "month": TruncMonth,
}


def get_expense_report(user, start_date: date, end_date: date, granularity: str = "day", branch_id=None) -> dict:
    branch_ids = resolve_branch_ids(user, branch_id)

    qs = Expense.objects.filter(
        branch__in=branch_ids,
        incurred_on__range=(start_date, end_date),
    )

    total_expenses = qs.aggregate(total=Sum("amount"))["total"] or Decimal("0")

    by_category_qs = (
        qs.values("category__name")
        .annotate(total=Sum("amount"), count=Count("id"))
        .order_by("-total")
    )

    by_category = [
        {
            "category": row["category__name"] or "Uncategorized",
            "total": row["total"],
            "count": row["count"],
            "percentage": float(row["total"] / total_expenses * 100) if total_expenses else 0.0,
        }
        for row in by_category_qs
    ]

    TruncFn = _TRUNC_MAP.get(granularity, TruncDay)
    time_series = (
        qs.annotate(period=TruncFn("incurred_on"))
        .values("period")
        .annotate(total=Sum("amount"), count=Count("id"))
        .order_by("period")
    )

    return {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "granularity": granularity,
        "total_expenses": total_expenses,
        "by_category": by_category,
        "time_series": [
            {
                "period": row["period"].isoformat() if hasattr(row["period"], "isoformat") else str(row["period"]),
                "total": row["total"],
                "count": row["count"],
            }
            for row in time_series
        ],
    }
