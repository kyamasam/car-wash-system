import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from subscriptions.constants import SubscriptionPaymentStatus
from subscriptions.models import SubscriptionPayment
from subscriptions.services.payment_handlers import PAYMENT_HANDLERS
from subscriptions.services.subscription import expire_stale_payment, refresh_payment

logger = logging.getLogger(__name__)

PENDING_TIMEOUT = timedelta(hours=24)


@shared_task
def reconcile_pending_subscription_payments():
    """Re-check pending payments the user stopped polling for, and fail ones that never completed."""
    cutoff = timezone.now() - PENDING_TIMEOUT
    pollable = [method for method, handler in PAYMENT_HANDLERS.items() if handler.supports_polling]
    pending = SubscriptionPayment.objects.filter(
        status=SubscriptionPaymentStatus.PENDING,
        payment_method__in=pollable,
        idempotency_key__isnull=False,
    )
    for payment in pending.iterator():
        try:
            payment = refresh_payment(payment)
        except Exception:
            logger.exception("Failed to reconcile subscription payment %s", payment.pk)
        if payment.status == SubscriptionPaymentStatus.PENDING and payment.created_at < cutoff:
            expire_stale_payment(payment)
