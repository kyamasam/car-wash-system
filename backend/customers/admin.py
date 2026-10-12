from django.contrib import admin
from customers.models import Customer, Vehicle


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("phone", "name", "email", "created_at")
    search_fields = ("phone", "name", "email")


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("plate_number", "vehicle_category", "make", "model", "color", "customer")
    list_filter = ("vehicle_category",)
    search_fields = ("plate_number", "make", "model")
