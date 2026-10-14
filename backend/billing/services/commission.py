from decimal import Decimal

from django.utils import timezone

from billing.constants import CommissionEntryType, CommissionEntryStatus
from billing.models import CommissionEntry
from services.constants import CommissionType


def calculate_commission_amount(service_price, line_total):
    """Return the commission amount for one job item based on its ServicePrice."""
    if service_price.commission_type == CommissionType.FIXED:
        return service_price.commission_value
    # PERCENTAGE
    return (service_price.commission_value / Decimal("100")) * line_total


def create_commission_entries(job, job_items_with_prices):
    """
    Create one CommissionEntry per job item for the assigned worker.

    job_items_with_prices: iterable of (JobItem, ServicePrice) tuples.
    Returns the created CommissionEntry list, or [] if worker is ineligible.
    """
    if not job.worker_id:
        return []

    # Re-fetch to access is_commission_eligible without a separate query if worker is prefetched
    worker = job.worker
    if not worker.is_commission_eligible:
        return []

    to_create = []
    for job_item, service_price in job_items_with_prices:
        amount = calculate_commission_amount(service_price, job_item.line_total)
        to_create.append(
            CommissionEntry(
                job=job,
                worker=worker,
                branch_id=job.branch_id,
                type=CommissionEntryType.EARNED,
                status=CommissionEntryStatus.PENDING,
                amount=amount,
                description=f"{job_item.job.job_number} — {service_price.service.name}",
                earned_at=timezone.now(),
            )
        )

    return CommissionEntry.objects.bulk_create(to_create)
