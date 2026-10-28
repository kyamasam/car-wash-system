from datetime import timedelta

from django.conf import settings
from django.db import migrations
from django.utils import timezone

from subscriptions.constants import Feature


def seed(apps, schema_editor):
    Package = apps.get_model("subscriptions", "Package")
    Subscription = apps.get_model("subscriptions", "Subscription")
    Business = apps.get_model("commons", "Business")

    package, _ = Package.objects.get_or_create(
        code="standard",
        defaults={
            "name": "Standard",
            "description": "All features. Set prices in the admin before enabling payments.",
            "features": ",".join(Feature.ALL),
            "is_default": True,
            "sort_order": 0,
        },
    )

    now = timezone.now()
    ends_at = now + timedelta(days=settings.SUBSCRIPTION_TRIAL_DAYS)
    already = set(Subscription.objects.filter(is_trial=True).values_list("business_id", flat=True))
    Subscription.objects.bulk_create([
        Subscription(business_id=business_id, package=package, is_trial=True, starts_at=now, ends_at=ends_at)
        for business_id in Business.objects.exclude(id__in=already).values_list("id", flat=True)
    ])


def unseed(apps, schema_editor):
    Subscription = apps.get_model("subscriptions", "Subscription")
    Subscription.objects.filter(is_trial=True, package__code="standard").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("subscriptions", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
