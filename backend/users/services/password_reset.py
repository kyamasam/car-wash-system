import logging
from datetime import timedelta
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()

class PasswordResetService:
    """Service to handle password reset functionality"""
    
    @staticmethod
    def generate_reset_token(user):
        """Generate a unique reset token for the user"""
        token = get_random_string(length=64)
        expires_at = timezone.now() + timedelta(hours=24)
        
        user.password_reset_code = token
        user.password_reset_code_used = False
        user.password_reset_code_expires_at = expires_at
        user.save(update_fields=['password_reset_code', 'password_reset_code_used', 'password_reset_code_expires_at'])
        
        return token
    
    @staticmethod
    def send_reset_email(user, reset_token):
        """Send password reset email to user"""
        try:
            front_end_link = getattr(settings, 'FRONT_END_LINK', '').rstrip('/')
            print(f"FRONT_END_LINK: {front_end_link}")
            reset_url = f"{front_end_link}/reset-password?token={reset_token}&email={user.email}"
            
            subject = f"Reset your {settings.PROJECT_NAME} password"
            from_email = settings.DEFAULT_FROM_EMAIL
            to_email = user.email
            
            context = {
                'user_first_name': user.first_name or user.email.split('@')[0],
                'project_name': settings.PROJECT_NAME,
                'reset_url': reset_url,
                'reset_token': reset_token,
                'expiry_hours': 24,
            }
            
            html_content = render_to_string('emails/passwordReset.html', context)
            text_content = strip_tags(html_content)
            
            msg = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            
            logger.info(f"Password reset email sent to {to_email} (user id: {user.id})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
            return False
    
    @classmethod
    def initiate_reset(cls, email):
        """Initiate password reset process for a user"""
        try:
            user = User.objects.get(email=email.lower())
            reset_token = cls.generate_reset_token(user)
            email_sent = cls.send_reset_email(user, reset_token)
            
            return {
                'success': email_sent,
                'message': 'If an account exists with this email, you will receive a password reset link.'
            }
        except User.DoesNotExist:
            # Return success even if user doesn't exist for security
            return {
                'success': True,
                'message': 'If an account exists with this email, you will receive a password reset link.'
            }
        except Exception as e:
            logger.error(f"Error in password reset initiation: {str(e)}")
            return {
                'success': False,
                'message': 'Unable to process password reset request. Please try again later.'
            }
    
    @staticmethod
    def reset_password(user, new_password):
        """Reset user's password"""
        user.set_password(new_password)
        user.password_reset_code_used = True
        user.save(update_fields=['password', 'password_reset_code_used'])
        
        logger.info(f"Password reset successful for user: {user.email}")
        return True