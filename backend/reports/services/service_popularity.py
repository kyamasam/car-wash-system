from datetime import date
from decimal import Decimal

from django.db.models import Count, Sum

from jobs.models import JobItem
from .utils import resolve_branch_ids


def get_service_popularity_report(user, start_date: date, end_date: date, branch_id=None) -> dict:
    branch_ids = resolve_branch_ids(user, branch_id)

    rows = list(
        JobItem.objects.filter(
            job__branch__in=branch_ids,
            job__checked_in_at__date__range=(start_date, end_date),
        )
        .values("service__id", "service__name", "service__category")
        .annotate(
            total_count=Count("id"),
            total_quantity=Sum("quantity"),
            total_revenue=Sum("line_total"),
        )
        .order_by("-total_revenue")
    )

    grand_total = sum((r["total_revenue"] or Decimal("0")) for r in rows)

    services = [
        {
            "service_id": str(row["service__id"]),
            "service_name": row["service__name"],
            "service_category": row["service__category"],
            "total_count": row["total_count"],
            "total_quantity": row["total_quantity"] or Decimal("0"),
            "total_revenue": row["total_revenue"] or Decimal("0"),
            "revenue_share_percent": (
                float(row["total_revenue"] / grand_total * 100) if grand_total else 0.0
            ),
        }
        for row in rows
    ]

    return {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "total_revenue": grand_total,
        "services": services,
    }
