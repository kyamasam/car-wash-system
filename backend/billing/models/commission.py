import uuid
from django.conf import settings
from django.db import models
from billing.constants import PaymentMethod, CommissionEntryType, CommissionEntryStatus


class CommissionPayout(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    worker = models.ForeignKey("workers.Worker", on_delete=models.PROTECT, related_name="payouts")
    branch = models.ForeignKey("commons.Branch", on_delete=models.PROTECT, related_name="commission_payouts")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    transaction_code = models.CharField(max_length=100, blank=True, null=True)
    period_start = models.DateField(blank=True, null=True)
    period_end = models.DateField(blank=True, null=True)
    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="payouts_made"
    )
    paid_at = models.DateTimeField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.worker.name} — {self.amount}"


class CommissionEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey("jobs.Job", on_delete=models.SET_NULL, null=True, blank=True, related_name="commission_entries")
    worker = models.ForeignKey("workers.Worker", on_delete=models.PROTECT, related_name="commission_entries")
    branch = models.ForeignKey("commons.Branch", on_delete=models.PROTECT, related_name="commission_entries")
    payout = models.ForeignKey(
        CommissionPayout, on_delete=models.SET_NULL, null=True, blank=True, related_name="entries"
    )
    type = models.CharField(max_length=20, choices=CommissionEntryType.choices, default=CommissionEntryType.EARNED)
    status = models.CharField(max_length=20, choices=CommissionEntryStatus.choices, default=CommissionEntryStatus.PENDING)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True, null=True)
    earned_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.worker.name} — {self.amount}"
