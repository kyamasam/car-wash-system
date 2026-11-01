import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)

RETRY_OPTIONS = {"autoretry_for": (Exception,), "retry_backoff": True, "max_retries": 3}


def _describe_user(user):
    if user is None:
        return ["No user linked"]
    name = " ".join(filter(None, [user.first_name, user.last_name])) or "-"
    phone = f"{user.phone_code or ''}{user.phone_number}" if user.phone_number else "-"
    return [
        f"Name: {name}",
        f"Email: {user.email}",
        f"Phone: {phone}",
        f"Email verified: {'yes' if user.email_verified else 'no'}",
    ]


def _format_time(value):
    return timezone.localtime(value).strftime("%Y-%m-%d %H:%M") if value else "-"


def _send(subject, lines):
    recipients = settings.ADMIN_NOTIFICATION_EMAILS
    if not recipients:
        return
    send_mail(subject, "\n".join(lines), settings.DEFAULT_FROM_EMAIL, recipients, fail_silently=False)
    logger.info("Admin notification sent: %s", subject)


@shared_task(**RETRY_OPTIONS)
def notify_business_created(business_id):
    from commons.models import Business

    business = Business.objects.select_related("primary_user").get(pk=business_id)
    _send(
        f"New business: {business.name}",
        [
            "A new business has signed up.",
            "",
            "Business",
            f"Name: {business.name}",
            f"ID: {business.pk}",
            f"Created: {_format_time(business.created_at)}",
            "",
            "Owner",
            *_describe_user(business.primary_user),
        ],
    )


@shared_task(**RETRY_OPTIONS)
def notify_subscription_paid(payment_id):
    from subscriptions.models import SubscriptionPayment
    from subscriptions.services.subscription import get_expiry

    payment = SubscriptionPayment.objects.select_related(
        "business__primary_user", "package", "initiated_by"
    ).get(pk=payment_id)
    business = payment.business
    lines = [
        "A subscription payment was received.",
        "",
        f"Business: {business.name}",
        f"Amount paid: {payment.currency} {payment.amount:,.2f}",
        f"Package: {payment.package.name} ({payment.get_period_display()}, {payment.days} days)",
        f"Payment method: {payment.get_payment_method_display()}",
        f"Payer phone: {payment.phone or '-'}",
        f"Receipt: {payment.receipt_number or '-'}",
        f"Paid at: {_format_time(payment.updated_at)}",
        f"Subscription now expires: {_format_time(get_expiry(business.pk))}",
        "",
        "Paid by",
        *_describe_user(payment.initiated_by),
    ]
    owner = business.primary_user
    if owner is not None and owner.pk != payment.initiated_by_id:
        lines += ["", "Business owner", *_describe_user(owner)]
    _send(f"Subscription payment: {business.name} — {payment.currency} {payment.amount:,.2f}", lines)
