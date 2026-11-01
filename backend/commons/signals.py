from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from commons.models import Business
from commons.tasks import notify_business_created


@receiver(post_save, sender=Business)
def notify_admins_of_new_business(sender, instance, created, **kwargs):
    if created:
        transaction.on_commit(lambda: notify_business_created.delay(instance.pk))
