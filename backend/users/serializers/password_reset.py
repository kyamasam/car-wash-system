from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.utils import timezone

User = get_user_model()

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            validate_email(value)
        except ValidationError:
            raise serializers.ValidationError("Invalid email format")

        return value.lower()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    email = serializers.EmailField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        
        # Verify token using password_reset_code fields
        email = data['email'].lower()
        token = data['token']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "No user found with this email address"})
        
        # Check if password reset token matches
        if user.password_reset_code != token:
            raise serializers.ValidationError({"token": "Invalid or expired reset link"})
        
        if user.password_reset_code_used:
            raise serializers.ValidationError({"token": "This reset link has already been used"})
        
        if user.password_reset_code_expires_at and user.password_reset_code_expires_at < timezone.now():
            raise serializers.ValidationError({"token": "This reset link has expired"})
        
        data['user'] = user
        return data