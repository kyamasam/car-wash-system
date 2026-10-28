import uuid
from django.conf import settings
from django.db import models
from commons.models import UtilColumnsModel
from jobs.constants import JobStatus, PaymentStatus, CollectionMethod


def generate_job_number():
    import random
    import string
    return "JOB-" + "".join(random.choices(string.digits, k=6))


class Job(UtilColumnsModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_number = models.CharField(max_length=20, unique=True, editable=False)
    branch = models.ForeignKey("commons.Branch", on_delete=models.PROTECT, related_name="jobs")
    customer = models.ForeignKey(
        "customers.Customer", on_delete=models.SET_NULL, null=True, blank=True, related_name="jobs"
    )
    vehicle = models.ForeignKey(
        "customers.Vehicle", on_delete=models.SET_NULL, null=True, blank=True, related_name="jobs"
    )
    worker = models.ForeignKey(
        "workers.Worker", on_delete=models.SET_NULL, null=True, blank=True, related_name="jobs"
    )
    status = models.CharField(max_length=30, choices=JobStatus.choices, default=JobStatus.QUEUED)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    collection_method = models.CharField(max_length=20, choices=CollectionMethod.choices, default=CollectionMethod.WALK_IN)
    pickup_address = models.TextField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    expected_collection_at = models.DateTimeField(blank=True, null=True)
    checked_in_at = models.DateTimeField(blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    collected_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    cancel_reason = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="jobs_created"
    )
    collected_recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="jobs_collected"
    )
    notes = models.TextField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["branch", "status"]),
            models.Index(fields=["branch", "checked_in_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.job_number:
            self.job_number = generate_job_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.job_number


class JobItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="items")
    service = models.ForeignKey("services.Service", on_delete=models.PROTECT, related_name="job_items")
    description = models.CharField(max_length=255, blank=True, null=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    length = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="By-size length")
    width = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="By-size width")
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    standard_unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True, help_text="Catalog price at time of sale"
    )
    is_custom_price = models.BooleanField(default=False, help_text="Unit price was overridden for this sale")
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
    tag_number = models.CharField(max_length=50, blank=True, null=True, help_text="Carpet tag")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.job.job_number} — {self.service.name}"
