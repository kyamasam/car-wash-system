import uuid
from django.db import models
from django.conf import settings
from commons.models import UtilColumnsModel
from services.constants import ServiceCategory, PricingUnit, CommissionType


class Service(UtilColumnsModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=30, unique=True)
    category = models.CharField(max_length=20, choices=ServiceCategory.choices)
    unit = models.CharField(max_length=20, choices=PricingUnit.choices, default=PricingUnit.PER_JOB)

    def __str__(self):
        return self.name


class ServicePrice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="prices")
    branch = models.ForeignKey(
        "commons.Branch", on_delete=models.CASCADE, null=True, blank=True, related_name="service_prices",
        help_text="NULL applies to all branches"
    )
    vehicle_category = models.CharField(max_length=20, blank=True, null=True, help_text="NULL means any vehicle")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    commission_value = models.DecimalField(max_digits=12, decimal_places=2)
    commission_type = models.CharField(max_length=20, choices=CommissionType.choices)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="service_prices_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.service.name} @ {self.price}"
