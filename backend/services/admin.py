from django.contrib import admin
from services.models import Service, ServicePrice


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "category", "unit", "size_unit", "icon_preview", "is_active")
    list_filter = ("category", "unit", "is_active")
    search_fields = ("name", "code")
    readonly_fields = ("icon_preview",)

    def icon_preview(self, obj):
        from django.utils.html import format_html
        if obj.icon:
            return format_html('<img src="{}" style="height:40px;border-radius:4px;" />', obj.icon.url)
        return "—"
    icon_preview.short_description = "Icon"


@admin.register(ServicePrice)
class ServicePriceAdmin(admin.ModelAdmin):
    list_display = ("service", "branch", "vehicle_category", "size_label", "price", "commission_value", "commission_type", "icon_preview")
    list_filter = ("commission_type", "branch")
    search_fields = ("service__name", "size_label")
    readonly_fields = ("icon_preview",)

    def icon_preview(self, obj):
        from django.utils.html import format_html
        if obj.icon:
            return format_html('<img src="{}" style="height:40px;border-radius:4px;" />', obj.icon.url)
        return "—"
    icon_preview.short_description = "Icon"
