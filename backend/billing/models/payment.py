import uuid
from django.conf import settings
from django.db import models
from billing.constants import PaymentMethod, PaymentType


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey("jobs.Job", on_delete=models.PROTECT, related_name="payments")
    branch = models.ForeignKey("commons.Branch", on_delete=models.PROTECT, related_name="payments")
    type = models.CharField(max_length=20, choices=PaymentType.choices, default=PaymentType.PAYMENT)
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_code = models.CharField(max_length=100, unique=True, blank=True, null=True)
    payer_phone = models.CharField(max_length=20, blank=True, null=True)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="payments_received"
    )
    paid_at = models.DateTimeField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.job.job_number} — {self.amount}"
