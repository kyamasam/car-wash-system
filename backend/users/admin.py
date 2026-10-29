from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from commons.admin_filters import business_filter, branch_filter
from users.models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'phone_number', 'role', 'business', 'branch', 'is_active', 'date_joined')
    search_fields = ('email', 'phone_number', 'first_name', 'last_name')
    list_filter = (business_filter(include_empty=True), branch_filter(include_empty=True), 'role', 'is_active', 'is_staff', 'date_joined')
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

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "usable_password", "password1", "password2"),
            },
        ),
        (
            "Car Wash Fields",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "phone_code",
                    "phone_number",
                    "role",
                    "business",
                    "branch",
                )
            },
        ),
    )

