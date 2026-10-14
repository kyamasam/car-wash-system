from datetime import date
from decimal import Decimal

from django.db.models import Count, Avg, Q, ExpressionWrapper, DurationField, F

from jobs.models import Job
from jobs.constants import JobStatus
from .utils import resolve_branch_ids


_ALL_STATUSES = [
    JobStatus.QUEUED,
    JobStatus.IN_PROGRESS,
    JobStatus.COMPLETED,
    JobStatus.READY_FOR_COLLECTION,
    JobStatus.COLLECTED,
    JobStatus.CANCELLED,
]


def get_jobs_summary_report(user, start_date: date, end_date: date, branch_id=None) -> dict:
    branch_ids = resolve_branch_ids(user, branch_id)

    qs = Job.objects.filter(
        branch__in=branch_ids,
        checked_in_at__date__range=(start_date, end_date),
    )

    total_jobs = qs.count()

    status_breakdown = [
        {"status": s, "count": qs.filter(status=s).count()}
        for s in _ALL_STATUSES
    ]

    turnaround = qs.filter(
        started_at__isnull=False,
        completed_at__isnull=False,
    ).annotate(
        duration=ExpressionWrapper(
            F("completed_at") - F("started_at"),
            output_field=DurationField(),
        )
    ).aggregate(avg=Avg("duration"))["avg"]

    avg_turnaround_minutes = (
        turnaround.total_seconds() / 60 if turnaround else None
    )

    per_worker = list(
        qs.filter(worker__isnull=False)
        .values("worker__id", "worker__name")
        .annotate(
            job_count=Count("id"),
            avg_duration=Avg(
                ExpressionWrapper(
                    F("completed_at") - F("started_at"),
                    output_field=DurationField(),
                ),
                filter=Q(started_at__isnull=False, completed_at__isnull=False),
            ),
        )
        .order_by("-job_count")
    )

    return {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "total_jobs": total_jobs,
        "status_breakdown": status_breakdown,
        "avg_turnaround_minutes": avg_turnaround_minutes,
        "per_worker": [
            {
                "worker_id": str(row["worker__id"]),
                "worker_name": row["worker__name"],
                "job_count": row["job_count"],
                "avg_turnaround_minutes": (
                    row["avg_duration"].total_seconds() / 60
                    if row["avg_duration"] else None
                ),
            }
            for row in per_worker
        ],
    }
