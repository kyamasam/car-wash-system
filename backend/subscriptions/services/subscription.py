import logging
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Max
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from commons.models import Business
from subscriptions.constants import (
    BillingPeriod,
    SubscriptionPaymentMethod,
    SubscriptionPaymentStatus,
    SubscriptionStatus,
)
from subscriptions.models import Package, Subscription, SubscriptionPayment
from subscriptions.services.payment_handlers import get_handler

logger = logging.getLogger(__name__)


def _active_rows(business_id):
    return Subscription.objects.filter(business_id=business_id, is_active=True, deleted_at__isnull=True)


def get_expiry(business_id):
    return _active_rows(business_id).aggregate(expires_at=Max("ends_at"))["expires_at"]


def is_active(business_id):
    return _active_rows(business_id).filter(ends_at__gt=timezone.now()).exists()


def get_subscription_state(business_id):
    """Current subscription state for a business, derived from its latest granted period."""
    now = timezone.now()
    latest = _active_rows(business_id).select_related("package").order_by("-ends_at").first()
    if latest is None:
        return {
            "status": SubscriptionStatus.EXPIRED,
            "expires_at": None,
            "is_trial": False,
            "days_remaining": 0,
            "package": None,
        }
    # The package in force right now, falling back to the latest one once everything has lapsed.
    current = (
        _active_rows(business_id).select_related("package")
        .filter(starts_at__lte=now, ends_at__gt=now).order_by("starts_at").first()
    ) or latest
    active = latest.ends_at > now
    remaining = latest.ends_at - now
    return {
        "status": SubscriptionStatus.ACTIVE if active else SubscriptionStatus.EXPIRED,
        "expires_at": latest.ends_at,
        "is_trial": current.is_trial if active else False,
        "days_remaining": max(remaining.days + (1 if remaining.seconds else 0), 0) if active else 0,
        "package": current.package,
    }


def get_default_package():
    return Package.objects.filter(is_default=True, is_active=True).first()


def start_trial(business):
    """Give a business its one trial period. Does nothing if it already had one or no default package exists."""
    package = get_default_package()
    if package is None:
        logger.warning("No default package configured; skipping trial for business %s", business.pk)
        return None
    if Subscription.objects.filter(business=business, is_trial=True).exists():
        return None
    now = timezone.now()
    try:
        with transaction.atomic():
            return Subscription.objects.create(
                business=business,
                package=package,
                is_trial=True,
                starts_at=now,
                ends_at=now + timedelta(days=settings.SUBSCRIPTION_TRIAL_DAYS),
            )
    except IntegrityError:
        return None


def grant_days(business_id, package, period, days, payment=None):
    """Add `days` after the current expiry (or from now if expired)."""
    with transaction.atomic():
        Business.objects.select_for_update().get(pk=business_id)
        now = timezone.now()
        expiry = get_expiry(business_id)
        starts_at = max(now, expiry) if expiry else now
        return Subscription.objects.create(
            business_id=business_id,
            package=package,
            is_trial=False,
            period=period,
            starts_at=starts_at,
            ends_at=starts_at + timedelta(days=days),
            payment=payment,
        )


def initiate_payment(user, package, period, payment_method=SubscriptionPaymentMethod.MPESA, phone=None):
    if payment_method not in SubscriptionPaymentMethod.ENABLED:
        raise ValidationError({"payment_method": f"'{payment_method}' payments are not available yet."})
    if period not in BillingPeriod.DAYS:
        raise ValidationError({"period": f"Invalid period '{period}'."})
    amount = package.price_for(period)
    if amount is None or amount <= 0:
        raise ValidationError({"period": f"The {package.name} package is not offered {period}."})

    payment = SubscriptionPayment(
        business_id=user.business_id,
        package=package,
        period=period,
        days=BillingPeriod.DAYS[period],
        amount=amount,
        currency=package.currency,
        payment_method=payment_method,
        phone=phone,
        initiated_by=user,
    )
    handler = get_handler(payment_method)
    handler.prepare(payment)
    payment.save()
    handler.initiate(payment)
    return payment


def refresh_payment(payment):
    """
    Sync a payment with its provider and grant days exactly once on success.
    Safe to call repeatedly and concurrently.
    """
    if payment.status in SubscriptionPaymentStatus.FINAL:
        return payment

    result = get_handler(payment.payment_method).refresh(payment)

    with transaction.atomic():
        payment = SubscriptionPayment.objects.select_for_update().select_related("package").get(pk=payment.pk)
        if payment.status in SubscriptionPaymentStatus.FINAL:
            return payment

        payment.raw_response = result["raw"]
        payment.receipt_number = result["receipt"] or payment.receipt_number
        payment.status = result["status"]

        if payment.status == SubscriptionPaymentStatus.SUCCEEDED:
            paid_amount = _to_decimal((result["raw"] or {}).get("amount"))
            if paid_amount is not None and paid_amount != payment.amount:
                logger.error(
                    "Subscription payment %s amount mismatch: expected %s, provider reported %s",
                    payment.pk, payment.amount, paid_amount,
                )
                payment.status = SubscriptionPaymentStatus.FAILED
                payment.failure_reason = f"Amount mismatch: expected {payment.amount}, got {paid_amount}"
            elif not Subscription.objects.filter(payment=payment).exists():
                grant_days(payment.business_id, payment.package, payment.period, payment.days, payment=payment)
        elif payment.status == SubscriptionPaymentStatus.FAILED:
            payment.failure_reason = (result["raw"] or {}).get("transaction_status") or "failed"

        payment.save()
    return payment


def expire_stale_payment(payment, reason="Timed out waiting for confirmation"):
    with transaction.atomic():
        payment = SubscriptionPayment.objects.select_for_update().get(pk=payment.pk)
        if payment.status == SubscriptionPaymentStatus.PENDING:
            payment.status = SubscriptionPaymentStatus.FAILED
            payment.failure_reason = reason
            payment.save(update_fields=["status", "failure_reason", "updated_at"])
    return payment


def _to_decimal(value):
    if value in (None, ""):
        return None
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None
