import uuid

from django.conf import settings
from django.db import models
from django.db.models import Q

from commons.models import UtilColumnsModel
from subscriptions.constants import BillingPeriod, SubscriptionPaymentMethod, SubscriptionPaymentStatus


class SubscriptionPayment(models.Model):
    """One payment attempt for a subscription period, regardless of payment method."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey("commons.Business", on_delete=models.PROTECT, related_name="subscription_payments")
    package = models.ForeignKey("subscriptions.Package", on_delete=models.PROTECT, related_name="payments")
    period = models.CharField(max_length=10, choices=BillingPeriod.choices)
    days = models.PositiveIntegerField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="KES")
    payment_method = models.CharField(
        max_length=20, choices=SubscriptionPaymentMethod.choices, default=SubscriptionPaymentMethod.MPESA
    )
    phone = models.CharField(max_length=20, null=True, blank=True)
    idempotency_key = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=SubscriptionPaymentStatus.choices, default=SubscriptionPaymentStatus.PENDING
    )
    receipt_number = models.CharField(max_length=100, null=True, blank=True)
    raw_response = models.JSONField(null=True, blank=True)
    failure_reason = models.TextField(null=True, blank=True)
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="subscription_payments",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "created_at"])]
        constraints = [
            models.CheckConstraint(
                condition=~Q(payment_method=SubscriptionPaymentMethod.MPESA) | Q(phone__isnull=False),
                name="subscription_payment_mpesa_requires_phone",
            ),
        ]

    def __str__(self):
        return f"{self.business} — {self.package} {self.period} ({self.status})"


class Subscription(UtilColumnsModel):
    """
    A granted period of access. Each trial or paid period is one row;
    the business's expiry is the latest ends_at across its rows.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey("commons.Business", on_delete=models.CASCADE, related_name="subscriptions")
    package = models.ForeignKey("subscriptions.Package", on_delete=models.PROTECT, related_name="subscriptions")
    is_trial = models.BooleanField(default=False)
    period = models.CharField(max_length=10, choices=BillingPeriod.choices, null=True, blank=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    # Unique: a payment can grant days at most once.
    payment = models.OneToOneField(
        SubscriptionPayment, on_delete=models.PROTECT, null=True, blank=True, related_name="subscription"
    )

    class Meta:
        ordering = ["-ends_at"]
        indexes = [models.Index(fields=["business", "ends_at"])]
        constraints = [
            models.UniqueConstraint(fields=["business"], condition=Q(is_trial=True), name="one_trial_per_business"),
        ]

    def __str__(self):
        kind = "trial" if self.is_trial else self.period
        return f"{self.business} — {self.package} {kind} until {self.ends_at:%Y-%m-%d}"
