from django.contrib import admin
from commons.admin_filters import business_filter, branch_filter
from customers.models import Customer, Vehicle


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("phone", "name", "email", "branch", "created_at")
    list_filter = (business_filter("branch__business"), branch_filter(include_empty=True))
    list_select_related = ("branch",)
    search_fields = ("phone", "name", "email")


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("plate_number", "vehicle_category", "make", "model", "color", "customer", "branch")
    list_filter = (business_filter("branch__business"), branch_filter(include_empty=True), "vehicle_category")
    list_select_related = ("customer", "branch")
    search_fields = ("plate_number", "make", "model")
