import uuid

import django
from django.db import models


class UtilColumnsModel(models.Model):
    """Abstract base with standard timestamp and soft-delete fields."""

    created_at = models.DateTimeField(default=django.utils.timezone.now, null=True, blank=True)
    updated_at = models.DateTimeField(blank=True, null=True, default=django.utils.timezone.now)
    is_active = models.BooleanField(default=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        abstract = True


