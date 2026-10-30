from datetime import date
from decimal import Decimal

from django.db.models import Sum, Q

from billing.models import CommissionEntry
from billing.constants import CommissionEntryStatus
from .utils import resolve_branch_ids, exclude_deleted_job_commissions


def get_commission_summary_report(user, start_date: date, end_date: date, branch_id=None) -> dict:
    branch_ids = resolve_branch_ids(user, branch_id)

    qs = exclude_deleted_job_commissions(CommissionEntry.objects.filter(
        branch__in=branch_ids,
        earned_at__date__range=(start_date, end_date),
    ))

    totals = qs.aggregate(
        total_pending=Sum("amount", filter=Q(status=CommissionEntryStatus.PENDING)),
        total_paid=Sum("amount", filter=Q(status=CommissionEntryStatus.PAID)),
        total_void=Sum("amount", filter=Q(status=CommissionEntryStatus.VOID)),
    )

    per_worker = list(
        qs.values("worker__id", "worker__name").annotate(
            pending_amount=Sum("amount", filter=Q(status=CommissionEntryStatus.PENDING)),
            paid_amount=Sum("amount", filter=Q(status=CommissionEntryStatus.PAID)),
            void_amount=Sum("amount", filter=Q(status=CommissionEntryStatus.VOID)),
        ).order_by("worker__name")
    )

    return {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "total_pending": totals["total_pending"] or Decimal("0"),
        "total_paid": totals["total_paid"] or Decimal("0"),
        "total_void": totals["total_void"] or Decimal("0"),
        "per_worker": [
            {
                "worker_id": str(row["worker__id"]),
                "worker_name": row["worker__name"],
                "pending_amount": row["pending_amount"] or Decimal("0"),
                "paid_amount": row["paid_amount"] or Decimal("0"),
                "void_amount": row["void_amount"] or Decimal("0"),
            }
            for row in per_worker
        ],
    }
