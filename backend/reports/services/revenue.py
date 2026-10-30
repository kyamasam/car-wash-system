from datetime import date
from decimal import Decimal

from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth

from billing.models import Payment
from billing.constants import PaymentType, PaymentMethod
from .utils import resolve_branch_ids
from .expense import get_expense_report
from .commission_paid import get_commissions_paid


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


def _get_payment_revenue(user, start_date: date, end_date: date, granularity: str = "day", branch_id=None) -> dict:
    """Payment-only revenue (no expenses/commissions). Used by the profit report."""
    branch_ids = resolve_branch_ids(user, branch_id)

    base_qs = Payment.objects.filter(
        branch__in=branch_ids,
        paid_at__date__range=(start_date, end_date),
        job__deleted_at__isnull=True,
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


def get_revenue_report(user, start_date: date, end_date: date, granularity: str = "day", branch_id=None) -> dict:
    revenue = _get_payment_revenue(user, start_date, end_date, granularity, branch_id)
    expenses = get_expense_report(user, start_date, end_date, granularity, branch_id)
    # Commissions are deducted on the day they were paid out, not the day earned.
    commissions = get_commissions_paid(user, start_date, end_date, granularity, branch_id)

    total_expenses = expenses["total_expenses"]
    total_commissions_paid = commissions["total"]

    revenue_by_period = {row["period"]: row for row in revenue["time_series"]}
    expense_by_period = {row["period"]: row["total"] for row in expenses["time_series"]}
    commission_by_period = {row["period"]: row["total"] for row in commissions["time_series"]}

    all_periods = sorted(set(revenue_by_period) | set(expense_by_period) | set(commission_by_period))
    time_series = []
    for p in all_periods:
        row = revenue_by_period.get(p, {})
        period_total = row.get("total") or Decimal("0")
        period_expenses = expense_by_period.get(p, Decimal("0"))
        period_commissions = commission_by_period.get(p, Decimal("0"))
        time_series.append({
            "period": p,
            "total": period_total,
            "count": row.get("count") or 0,
            "expenses": period_expenses,
            "commissions": period_commissions,
            "profit": period_total - period_expenses - period_commissions,
        })

    return {
        **revenue,
        "total_expenses": total_expenses,
        "total_commissions_paid": total_commissions_paid,
        "profit": revenue["net_revenue"] - total_expenses - total_commissions_paid,
        "time_series": time_series,
    }
