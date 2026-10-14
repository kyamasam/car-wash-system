import uuid

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models

from ..constants import UserRole
from commons.models import UtilColumnsModel  # noqa: F401 - re-exported for backwards compat

phone_validator = RegexValidator(
    regex=r"^\d{9,10}$",
    message="Enter a valid phone number (9-10 digits)",
)

phone_code_validator = RegexValidator(
    regex=r"^\+\d{1,3}$",
    message="Enter a valid country code (e.g. +254)",
)


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('User must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, phone_code, phone_number, password, **extra_fields):
        user = self.create_user(email, password, phone_code=phone_code, phone_number=phone_number, **extra_fields)
        user.is_superuser = True
        user.is_staff = True
        user.save(using=self._db)
        return user


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=255, blank=True, null=True, unique=False)
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    phone_code = models.CharField(max_length=4, validators=[phone_code_validator], blank=True, null=True)
    phone_number = models.CharField(max_length=10, validators=[phone_validator], blank=True, null=True, unique=True)
    staff_number = models.CharField(max_length=30, unique=True, null=True)
    account_claimed = models.BooleanField(default=False)
    password_reset_code = models.CharField(max_length=300, blank=True)
    avatar = models.ImageField(blank=True)
    password_reset_code_expires_at = models.DateTimeField(blank=True, null=True)
    password_reset_code_used = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=255, blank=True)
    otp_code_used = models.BooleanField(default=False)
    otp_code_expires_at = models.DateTimeField(blank=True, null=True)
    email_verified = models.BooleanField(default=False)

    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.ATTENDANT,
    )
    business = models.ForeignKey(
        "commons.Business",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="users",
    )
    branch = models.ForeignKey(
        "commons.Branch",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="users",
        help_text="NULL means access to all branches",
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['phone_code', 'phone_number']

    objects = CustomUserManager()

    def save(self, *args, **kwargs):
        if self.username is None:
            self.username = self.email
        return super().save(*args, **kwargs)


