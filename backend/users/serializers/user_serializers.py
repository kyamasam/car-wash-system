import os
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.mail import EmailMessage
from django.db import transaction
from django.template.loader import get_template
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


class GroupSerializer(serializers.ModelSerializer):
    name = serializers.CharField()
    permissions = serializers.PrimaryKeyRelatedField(many=True, queryset=Permission.objects.all(), required=False)

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions']

    def create(self, validated_data):
        permissions = validated_data.pop('permissions', [])
        group = Group.objects.create(**validated_data)
        if permissions:
            group.permissions.set(permissions)
        return group

    def update(self, instance, validated_data):
        if 'permissions' in validated_data:
            permissions = validated_data.pop('permissions')
            instance.permissions.set(permissions)
        return super().update(instance, validated_data)


class LimitedUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["is_superuser"] = user.is_superuser
        token["email_verified"] = user.email_verified
        token["email"] = user.email
        token["role"] = user.role
        return token


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters long")
        return value


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False,
                                     style={"input_type": "password", "placeholder": "Password"})
    groups_objects = serializers.SerializerMethodField("get_groups_objects", read_only=True)
    groups = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), many=True, required=False)
    is_admin = serializers.SerializerMethodField()

    def get_is_admin(self, obj):
        return obj.is_superuser

    def get_groups_objects(self, obj) -> list:
        return GroupSerializer(obj.groups, many=True).data

    class Meta:
        model = User
        fields = [
            "id", "first_name", "last_name", "username", "password", "phone_code", "phone_number",
            "groups", "groups_objects", "staff_number", "is_admin",
            "email", "role", "business", "branch", "email_verified",
        ]

    def validate_phone_number(self, value):
        if not value:
            return value
        qs = User.objects.filter(phone_number=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        from users.services.account_confirmation import send_account_confirmation_email

        groups = validated_data.pop("groups", None)
        if not self.context["request"].user.is_staff:
            groups = []
        email = validated_data.get("email")

        try:
            existing_user = User.objects.get(email=email, account_claimed=False)
            password = validated_data.get("password")
            if password:
                existing_user.set_password(password)
            existing_user.first_name = validated_data.get("first_name", existing_user.first_name)
            existing_user.last_name = validated_data.get("last_name", existing_user.last_name)
            existing_user.is_active = True
            existing_user.email_verified = False
            existing_user.save()
            # send_account_confirmation_email(existing_user)
            return existing_user
        except User.DoesNotExist:
            pass

        user = User.objects.create_user(is_active=True, **validated_data)

        if groups is not None:
            for group in groups:
                user.groups.add(group)

        return user

    def update(self, instance, validated_data):
        groups = validated_data.pop("groups", None)
        password = validated_data.pop("password", None)
        validated_data.pop("staff_number", None)
        if not self.context["request"].user.is_staff:
            groups = None

        user = super().update(instance, validated_data)
        if password:
            user.password = make_password(password)
            user.save()

        if groups is not None:
            user.groups.clear()
            for group in groups:
                user.groups.add(group)
        user.save()

        return user


class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class MiniUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]


class ResetPasswordSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ["email", "password_reset_code", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        try:
            user = User.objects.get(
                email=validated_data.get("email"),
                password_reset_code=validated_data.get("password_reset_code"),
            )
            now = timezone.now()
            if user.password_reset_code_expires_at < now:
                raise serializers.ValidationError("Password reset code is expired")
            if user.password_reset_code_used:
                raise serializers.ValidationError("Password reset code has already been used")
        except User.DoesNotExist:
            raise serializers.ValidationError("Code is invalid or user with that email does not exist")

        if password:
            user.password = make_password(password)
            user.password_reset_code_used = True
            user.save()
            message = get_template("emails/passwordChangeSuccess.html").render(
                {"project_name": os.environ.get("PROJECT_NAME")})
            mail = EmailMessage(
                subject="Password Changed Successfully",
                body=message,
                from_email=os.environ.get("EMAIL_HOST_USER"),
                to=[user.email],
            )
            mail.content_subtype = "html"
            mail.send()
        return User


class ConfirmAccountSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp_code = serializers.CharField(required=True)
    password = serializers.CharField(required=False, min_length=8, allow_blank=True, write_only=True)
    confirm_password = serializers.CharField(required=False, min_length=8, allow_blank=True, write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        otp_code = attrs.get('otp_code')
        password = attrs.get('password', '')
        confirm_password = attrs.get('confirm_password', '')

        try:
            user = User.objects.get(email=email, otp_code=otp_code)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP code or email address.")

        if user.email_verified:
            raise serializers.ValidationError("Your email address has already been verified.")
        if user.otp_code_used:
            raise serializers.ValidationError("This confirmation link has already been used.")

        now = timezone.now()
        if user.otp_code_expires_at is None or user.otp_code_expires_at < now:
            raise serializers.ValidationError("This confirmation link has expired.")
        if password and password != confirm_password:
            raise serializers.ValidationError("Passwords do not match.")

        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        password = self.validated_data.get('password', '')

        user.is_active = True
        user.email_verified = True
        user.otp_code_used = True

        if password:
            user.set_password(password)
            user.save(update_fields=['is_active', 'email_verified', 'otp_code_used', 'password'])
        else:
            user.save(update_fields=['is_active', 'email_verified', 'otp_code_used'])

        if user.has_usable_password():
            refresh = RefreshToken.for_user(user)
            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'first_name': user.first_name or '',
                    'last_name': user.last_name or '',
                    'username': user.username,
                    'role': user.role,
                }
            }
        return {}


class SendPasswordResetCodeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def create(self, validated_data):
        email = validated_data.pop("email")
        try:
            user = User.objects.get(email=email)
        except ObjectDoesNotExist:
            return validated_data
        password_reset_code = get_random_string(length=12)
        user.password_reset_code = password_reset_code
        user.password_reset_code_used = False
        now = timezone.now()
        future_date = now + timedelta(hours=settings.PASSWORD_RESET_TIMEOUT["hours"],
                                      days=settings.PASSWORD_RESET_TIMEOUT["days"])
        user.password_reset_code_expires_at = future_date
        user.save()
        fe_link = os.environ.get('FRONT_END_LINK', '')
        if fe_link and not fe_link.endswith('/'):
            fe_link += '/'
        message = get_template("emails/passwordReset.html").render({
            "expiry_date": future_date,
            "front_end_link": fe_link,
            "password_reset_code": password_reset_code,
            "action_url": f"{fe_link}renew-password/{password_reset_code}",
            "project_name": os.environ.get("PROJECT_NAME"),
        })
        mail = EmailMessage(
            subject="Password Reset Request",
            body=message,
            from_email=os.environ.get("EMAIL_HOST_USER"),
            to=[email],
        )
        mail.content_subtype = "html"
        mail.send()
        return user


class ContentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentType
        fields = ['id', 'app_label', 'model']


class PermissionSerializer(serializers.ModelSerializer):
    content_type = ContentTypeSerializer(read_only=True)

    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type']
