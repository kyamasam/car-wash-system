from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from users.services.account_confirmation import send_account_confirmation_email


@receiver(post_save, sender='users.User')
def send_confirmation_on_signup(sender, instance, created, **kwargs):
    """
    Email an OTP to unverified users when they sign up or claim an existing account.
    Mirrors resend_verification: verified users are skipped.
    """
    if instance.email_verified:
        return
    # created: new signup. _send_confirmation: set by the serializer on the claim path.
    # The service's own save() is neither, so it won't re-trigger.
    if created or getattr(instance, '_send_confirmation', False):
        instance._send_confirmation = False
        transaction.on_commit(lambda: send_account_confirmation_email(instance))
