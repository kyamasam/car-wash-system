from datetime import date
from decimal import Decimal

from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth

from billing.models import Payment
from billing.constants import PaymentType, PaymentMethod
from .utils import resolve_branch_ids


_TRUNC_MAP = {
    "day": TruncDay,
    "week": TruncWeek,
    "month": TruncMonth,
}

_ALL_METHODS = [
    PaymentMethod.CASH,
    PaymentMethod.MPESA,
    PaymentMethod.CARD,
    PaymentMethod.BANK_TRANSFER,
]


def get_revenue_report(user, start_date: date, end_date: date, granularity: str = "day", branch_id=None) -> dict:
    branch_ids = resolve_branch_ids(user, branch_id)

    base_qs = Payment.objects.filter(
        branch__in=branch_ids,
        paid_at__date__range=(start_date, end_date),
    )

    payments_qs = base_qs.filter(type=PaymentType.PAYMENT)
    refunds_qs = base_qs.filter(type=PaymentType.REFUND)

    gross = payments_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0")
    refunds = refunds_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0")
    net = gross - refunds
    total_jobs = payments_qs.values("job_id").distinct().count()

    TruncFn = _TRUNC_MAP.get(granularity, TruncDay)
    time_series = (
        payments_qs
        .annotate(period=TruncFn("paid_at"))
        .values("period")
        .annotate(total=Sum("amount"), count=Count("id"))
        .order_by("period")
    )

    method_totals = (
        payments_qs
        .values("method")
        .annotate(total=Sum("amount"), count=Count("id"))
    )
    method_map = {row["method"]: row for row in method_totals}

    method_breakdown = []
    for m in _ALL_METHODS:
        row = method_map.get(m, {})
        total = row.get("total") or Decimal("0")
        method_breakdown.append({
            "method": m,
            "total": total,
            "count": row.get("count") or 0,
            "percentage": float(total / gross * 100) if gross else 0.0,
        })

    return {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "granularity": granularity,
        "gross_revenue": gross,
        "refunds_total": refunds,
        "net_revenue": net,
        "total_jobs": total_jobs,
        "time_series": [
            {
                "period": row["period"].date().isoformat() if hasattr(row["period"], "date") else str(row["period"]),
                "total": row["total"],
                "count": row["count"],
            }
            for row in time_series
        ],
        "method_breakdown": method_breakdown,
    }
