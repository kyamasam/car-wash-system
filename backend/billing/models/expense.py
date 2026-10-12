import uuid
from django.conf import settings
from django.db import models
from billing.constants import PaymentMethod


class Expense(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey("commons.Branch", on_delete=models.PROTECT, related_name="expenses")
    category = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    transaction_code = models.CharField(max_length=100, blank=True, null=True)
    receipt_url = models.URLField(blank=True, null=True)
    incurred_on = models.DateField()
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses_recorded"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category} — {self.amount}"
