from datetime import date
from decimal import Decimal

from .revenue import _get_payment_revenue
from .expense import get_expense_report
from .commission_paid import get_commissions_paid


def get_profit_report(user, start_date: date, end_date: date, granularity: str = "day", branch_id=None) -> dict:
    revenue = _get_payment_revenue(user, start_date, end_date, granularity, branch_id)
    expenses = get_expense_report(user, start_date, end_date, granularity, branch_id)
    # Commissions are deducted on the day they were paid out, not the day earned.
    commissions = get_commissions_paid(user, start_date, end_date, granularity, branch_id)

    gross_revenue = revenue["gross_revenue"]
    refunds = revenue["refunds_total"]
    net_revenue = revenue["net_revenue"]
    total_expenses = expenses["total_expenses"]
    total_commissions_paid = commissions["total"]
    net_profit = net_revenue - total_expenses - total_commissions_paid

    # Build per-period lookup
    revenue_by_period = {row["period"]: row["total"] for row in revenue["time_series"]}
    expense_by_period = {row["period"]: row["total"] for row in expenses["time_series"]}
    commission_by_period = {row["period"]: row["total"] for row in commissions["time_series"]}

    all_periods = sorted(set(revenue_by_period) | set(expense_by_period) | set(commission_by_period))
    time_series = []
    for p in all_periods:
        period_revenue = revenue_by_period.get(p, Decimal("0"))
        period_expenses = expense_by_period.get(p, Decimal("0"))
        period_commissions = commission_by_period.get(p, Decimal("0"))
        time_series.append({
            "period": p,
            "revenue": period_revenue,
            "expenses": period_expenses,
            "commissions": period_commissions,
            "profit": period_revenue - period_expenses - period_commissions,
        })

    return {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "granularity": granularity,
        "gross_revenue": gross_revenue,
        "refunds_total": refunds,
        "net_revenue": net_revenue,
        "total_expenses": total_expenses,
        "total_commissions_paid": total_commissions_paid,
        "net_profit": net_profit,
        "time_series": time_series,
    }
