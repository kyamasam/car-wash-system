import uuid
from django.db import models
from django.conf import settings
from commons.models import UtilColumnsModel
from services.constants import ServiceCategory, PricingUnit, SizeUnit, CommissionType


class Service(UtilColumnsModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        "commons.Business", on_delete=models.CASCADE, null=True, related_name="services"
    )
    branch = models.ForeignKey(
        "commons.Branch", on_delete=models.CASCADE, null=True, blank=True, related_name="services",
        help_text="NULL applies to all branches"
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=30)
    category = models.CharField(max_length=20, choices=ServiceCategory.choices)
    unit = models.CharField(max_length=20, choices=PricingUnit.choices, default=PricingUnit.PER_JOB)
    size_unit = models.CharField(
        max_length=10, choices=SizeUnit.choices, null=True, blank=True,
        help_text="Measurement unit for by_size services; price is the rate per this unit"
    )
    icon = models.ImageField(upload_to="services/icons/", null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["business", "code"], name="unique_service_code_per_business"),
        ]

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
    size_label = models.CharField(max_length=50, blank=True, null=True, help_text="e.g. Small, Medium, Large — for size-based services")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    commission_value = models.DecimalField(max_digits=12, decimal_places=2)
    commission_type = models.CharField(max_length=20, choices=CommissionType.choices)
    icon = models.ImageField(upload_to="services/price_icons/", null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="service_prices_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.service.name} @ {self.price}"
