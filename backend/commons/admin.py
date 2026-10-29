from django.contrib import admin

from commons.admin_filters import business_filter, branch_filter
from commons.models import Business, Branch, AuditLog


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ("name", "currency", "is_active", "created_at")
    search_fields = ("name",)

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if obj and obj.currency:
            readonly.append("currency")
        return readonly


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "business", "location", "is_active", "created_at")
    list_filter = (business_filter(), "is_active")
    search_fields = ("name", "code")
    list_select_related = ("business",)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "entity_type", "entity_id", "user", "branch", "created_at")
    list_filter = (business_filter("branch__business"), branch_filter(include_empty=True), "entity_type", "action")
    list_select_related = ("user", "branch")
    readonly_fields = ("created_at",)
