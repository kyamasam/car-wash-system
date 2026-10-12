import uuid
from django.db import models
from commons.models import UtilColumnsModel


class Worker(UtilColumnsModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey("commons.Branch", on_delete=models.PROTECT, related_name="workers")
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    national_id = models.CharField(max_length=30, blank=True, null=True)
    is_commission_eligible = models.BooleanField(default=True)
    joined_at = models.DateField(blank=True, null=True)

    def __str__(self):
        return self.name
