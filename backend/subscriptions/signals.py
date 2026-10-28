from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from commons.models import Business
from subscriptions.services.subscription import start_trial


@receiver(post_save, sender=Business)
def start_business_trial(sender, instance, created, **kwargs):
    if created:
        transaction.on_commit(lambda: start_trial(instance))
