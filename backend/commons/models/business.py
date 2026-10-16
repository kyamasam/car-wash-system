import uuid

from django.db import models

from .base import UtilColumnsModel


class Business(UtilColumnsModel):
    CURRENCY_CHOICES = [
        ("KES", "Kenyan Shilling"),
        ("USD", "US Dollar"),
        ("EUR", "Euro"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    primary_user = models.ForeignKey(
        "users.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="owned_businesses",
    )
    logo = models.ImageField(upload_to="businesses/logos/", null=True, blank=True)
    # Set once; locked afterwards (enforced in BusinessSerializer and admin).
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, null=True, blank=True)

    class Meta:
        verbose_name_plural = "businesses"

    def __str__(self):
        return self.name


class Branch(UtilColumnsModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="branches")
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, unique=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        verbose_name_plural = "branches"

    def __str__(self):
        return f"{self.business.name} — {self.name}"
