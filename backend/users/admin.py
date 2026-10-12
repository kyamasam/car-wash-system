from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from users.models import User, Profile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'phone_number', 'role', 'business', 'branch', 'is_active', 'date_joined')
    search_fields = ('email', 'phone_number', 'first_name', 'last_name')
    list_filter = ('role', 'is_active', 'is_staff', 'date_joined')
    list_editable = ('is_active',)
    ordering = ('-date_joined',)
    list_per_page = 25

    fieldsets = UserAdmin.fieldsets + (
        (
            "Car Wash Fields",
            {
                "fields": (
                    "phone_code",
                    "phone_number",
                    "staff_number",
                    "role",
                    "business",
                    "branch",
                    "password_reset_code",
                    "password_reset_code_expires_at",
                    "password_reset_code_used",
                    "otp_code",
                    "otp_code_used",
                    "otp_code_expires_at",
                    "email_verified",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Car Wash Fields",
            {
                "fields": (
                    "phone_code",
                    "phone_number",
                    "role",
                    "business",
                    "branch",
                )
            },
        ),
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'tagline', 'created_at')
    search_fields = ('user__email',)
    ordering = ('-created_at',)
