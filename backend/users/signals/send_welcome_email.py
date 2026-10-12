import logging
import random
from datetime import timedelta

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_account_confirmation_email(user):
    """
    Send a confirmation email to a newly registered user.

    Generates a 4-digit numeric OTP, stores it on the user record,
    and emails the user a code they can enter to verify their account.

    Args:
        user: User instance that was just created

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Generate a 4-digit numeric OTP
        otp_code = str(random.randint(1000, 9999))
        otp_expires_at = timezone.now() + timedelta(hours=24)

        user.otp_code = otp_code
        user.otp_code_used = False
        user.otp_code_expires_at = otp_expires_at
        user.save(update_fields=['otp_code', 'otp_code_used', 'otp_code_expires_at'])

        front_end_link = getattr(settings, 'FRONT_END_LINK', '').rstrip('/')
        password_set = user.has_usable_password()
        confirmation_url = (
            f"{front_end_link}/verify-email"
            f"?email={user.email}&token={otp_code}&password_set={'true' if password_set else 'false'}"
        )

        subject = f"Confirm your {settings.PROJECT_NAME} account"
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = user.email

        context = {
            'user_first_name': user.first_name or user.email,
            'project_name': settings.PROJECT_NAME,
            'confirmation_url': confirmation_url,
            'otp_code': otp_code,
            'expiry_hours': 24,
        }

        html_content = render_to_string('emails/accountConfirmation.html', context)
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)

        logger.info(f"Account confirmation email sent to {to_email} (user id: {user.id})")
        return True

    except Exception as e:
        logger.error(f"Failed to send account confirmation email to {user.email}: {str(e)}")
        return False


@receiver(post_save, sender='users.User')
def handle_user_created(sender, instance, created, **kwargs):
    """
    Send a confirmation email for password-registered users only.
    Social login users (Google, etc.) are verified immediately and skip this step.
    """
    if created and getattr(instance, 'login_type', 'password') == 'password':
        send_account_confirmation_email(instance)
