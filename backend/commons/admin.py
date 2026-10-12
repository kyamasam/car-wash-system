from django.contrib import admin

from commons.models import Business, Branch, AuditLog


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    search_fields = ("name",)


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "business", "location", "is_active", "created_at")
    list_filter = ("business", "is_active")
    search_fields = ("name", "code")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "entity_type", "entity_id", "user", "branch", "created_at")
    list_filter = ("entity_type", "action")
    readonly_fields = ("created_at",)
