from django.contrib import admin
from services.models import Service, ServicePrice


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "category", "unit", "is_active")
    list_filter = ("category", "unit", "is_active")
    search_fields = ("name", "code")


@admin.register(ServicePrice)
class ServicePriceAdmin(admin.ModelAdmin):
    list_display = ("service", "branch", "vehicle_category", "price", "commission_value", "commission_type")
    list_filter = ("commission_type", "branch")
    search_fields = ("service__name",)
