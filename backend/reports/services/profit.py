from datetime import date
from decimal import Decimal

from .revenue import get_revenue_report
from .expense import get_expense_report


def get_profit_report(user, start_date: date, end_date: date, granularity: str = "day", branch_id=None) -> dict:
    revenue = get_revenue_report(user, start_date, end_date, granularity, branch_id)
    expenses = get_expense_report(user, start_date, end_date, granularity, branch_id)

    gross_revenue = revenue["gross_revenue"]
    refunds = revenue["refunds_total"]
    net_revenue = revenue["net_revenue"]
    total_expenses = expenses["total_expenses"]
    net_profit = net_revenue - total_expenses

    # Build per-period lookup
    revenue_by_period = {row["period"]: row["total"] for row in revenue["time_series"]}
    expense_by_period = {row["period"]: row["total"] for row in expenses["time_series"]}

    all_periods = sorted(set(revenue_by_period) | set(expense_by_period))
    time_series = [
        {
            "period": p,
            "revenue": revenue_by_period.get(p, Decimal("0")),
            "expenses": expense_by_period.get(p, Decimal("0")),
            "profit": revenue_by_period.get(p, Decimal("0")) - expense_by_period.get(p, Decimal("0")),
        }
        for p in all_periods
    ]

    return {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "granularity": granularity,
        "gross_revenue": gross_revenue,
        "refunds_total": refunds,
        "net_revenue": net_revenue,
        "total_expenses": total_expenses,
        "net_profit": net_profit,
        "time_series": time_series,
    }
