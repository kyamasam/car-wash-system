import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from commons.models import UtilColumnsModel
from subscriptions.constants import BillingPeriod, Feature


class Package(UtilColumnsModel):
    """A subscription tier. A null price means that billing period is not offered."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.SlugField(max_length=50, unique=True)
    description = models.TextField(blank=True, default="")
    features = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text=f"Comma-separated feature codes. Valid values: {', '.join(Feature.ALL)}",
    )
    daily_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    weekly_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    monthly_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    yearly_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="KES")
    is_default = models.BooleanField(default=False, help_text="Package new businesses start their trial on")
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(fields=["is_default"], condition=Q(is_default=True), name="unique_default_package"),
        ]

    def __str__(self):
        return self.name

    @property
    def feature_list(self):
        return [f.strip() for f in self.features.split(",") if f.strip()]

    def has_feature(self, feature):
        return feature in self.feature_list

    def price_for(self, period):
        field = BillingPeriod.PRICE_FIELD.get(period)
        return getattr(self, field) if field else None

    def clean(self):
        unknown = [f for f in self.feature_list if f not in Feature.ALL]
        if unknown:
            raise ValidationError({"features": f"Unknown features: {', '.join(unknown)}"})
        self.features = ",".join(self.feature_list)
