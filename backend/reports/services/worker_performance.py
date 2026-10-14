from datetime import date
from decimal import Decimal

from django.db.models import Count, Avg, Sum, Q, ExpressionWrapper, DurationField, F

from jobs.models import Job
from jobs.constants import JobStatus
from billing.models import CommissionEntry
from billing.constants import CommissionEntryStatus
from .utils import resolve_branch_ids


_DONE_STATUSES = [JobStatus.COMPLETED, JobStatus.READY_FOR_COLLECTION, JobStatus.COLLECTED]


def get_worker_performance_report(
    user, start_date: date, end_date: date, branch_id=None, worker_id=None
) -> dict:
    branch_ids = resolve_branch_ids(user, branch_id)

    job_qs = Job.objects.filter(
        branch__in=branch_ids,
        checked_in_at__date__range=(start_date, end_date),
        worker__isnull=False,
    )
    if worker_id:
        job_qs = job_qs.filter(worker_id=worker_id)

    job_rows = list(
        job_qs
        .filter(status__in=_DONE_STATUSES)
        .values("worker__id", "worker__name")
        .annotate(
            jobs_completed=Count("id"),
            avg_duration=Avg(
                ExpressionWrapper(
                    F("completed_at") - F("started_at"),
                    output_field=DurationField(),
                ),
                filter=Q(started_at__isnull=False, completed_at__isnull=False),
            ),
        )
    )
    job_map = {row["worker__id"]: row for row in job_rows}

    commission_qs = CommissionEntry.objects.filter(
        branch__in=branch_ids,
        earned_at__date__range=(start_date, end_date),
    )
    if worker_id:
        commission_qs = commission_qs.filter(worker_id=worker_id)

    commission_rows = list(
        commission_qs.values("worker__id", "worker__name").annotate(
            commission_earned=Sum("amount", filter=Q(type="earned")),
            commission_pending=Sum("amount", filter=Q(status=CommissionEntryStatus.PENDING)),
            commission_paid=Sum("amount", filter=Q(status=CommissionEntryStatus.PAID)),
        )
    )
    commission_map = {row["worker__id"]: row for row in commission_rows}

    all_worker_ids = set(job_map) | set(commission_map)

    result = []
    for wid in all_worker_ids:
        j = job_map.get(wid, {})
        c = commission_map.get(wid, {})
        name = j.get("worker__name") or c.get("worker__name") or ""
        avg_dur = j.get("avg_duration")
        result.append({
            "worker_id": str(wid),
            "worker_name": name,
            "jobs_completed": j.get("jobs_completed", 0),
            "commission_earned": c.get("commission_earned") or Decimal("0"),
            "commission_pending": c.get("commission_pending") or Decimal("0"),
            "commission_paid": c.get("commission_paid") or Decimal("0"),
            "avg_turnaround_minutes": avg_dur.total_seconds() / 60 if avg_dur else None,
        })

    result.sort(key=lambda x: x["jobs_completed"], reverse=True)

    return {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "workers": result,
    }
