from django.db import transaction
from django.utils import timezone

from billing.constants import CommissionEntryStatus
from billing.models import CommissionEntry


def soft_delete_job(job, user=None):
    """
    Mark a job as deleted without removing it from the database.
    Pending commissions are voided; paid commissions are left untouched.
    """
    with transaction.atomic():
        now = timezone.now()
        job.deleted_at = now
        job.deleted_by = user
        job.is_active = False
        job.updated_at = now
        job.save(update_fields=["deleted_at", "deleted_by", "is_active", "updated_at"])

        CommissionEntry.objects.filter(
            job=job,
            status=CommissionEntryStatus.PENDING,
        ).update(status=CommissionEntryStatus.VOID)

    return job
