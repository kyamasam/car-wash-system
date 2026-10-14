from decimal import Decimal

from django.db import transaction
from django.db.models import Q, Sum, Value, DecimalField
from django.db.models.functions import Coalesce

from billing.constants import PaymentType, CommissionEntryStatus
from billing.models import CommissionEntry
from jobs.constants import PaymentStatus


def record_payment(payment):
    """
    Persist a Payment and update Job.amount_paid / payment_status atomically.
    If the job becomes fully paid, stamp earned_at on pending CommissionEntries.

    payment must be an unsaved Payment instance with all fields set.
    Returns the saved Payment.
    """
    with transaction.atomic():
        payment.save()

        job = (
            payment.job.__class__._default_manager
            .select_for_update()
            .get(pk=payment.job_id)
        )

        totals = job.payments.aggregate(
            paid=Coalesce(
                Sum("amount", filter=~Q(type=PaymentType.REFUND)),
                Value(Decimal("0")),
                output_field=DecimalField(),
            ),
            refunded=Coalesce(
                Sum("amount", filter=Q(type=PaymentType.REFUND)),
                Value(Decimal("0")),
                output_field=DecimalField(),
            ),
        )
        amount_paid = totals["paid"] - totals["refunded"]

        if amount_paid >= job.total_amount:
            status = PaymentStatus.PAID
        elif amount_paid > 0:
            status = PaymentStatus.PARTIALLY_PAID
        else:
            status = PaymentStatus.UNPAID

        job.amount_paid = amount_paid
        job.payment_status = status
        job.save(update_fields=["amount_paid", "payment_status", "updated_at"])

        if status == PaymentStatus.PAID:
            CommissionEntry.objects.filter(
                job=job,
                status=CommissionEntryStatus.PENDING,
            ).update(earned_at=payment.paid_at)

    return payment
