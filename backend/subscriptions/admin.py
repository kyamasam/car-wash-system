from django.contrib import admin

from subscriptions.models import Package, Subscription, SubscriptionPayment


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "daily_price", "weekly_price", "monthly_price", "yearly_price",
                    "currency", "is_default", "is_active", "sort_order")
    list_filter = ("is_active", "is_default")
    search_fields = ("name", "code")
    prepopulated_fields = {"code": ("name",)}


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("business", "package", "is_trial", "period", "starts_at", "ends_at", "payment")
    list_filter = ("is_trial", "period", "package")
    search_fields = ("business__name",)
    raw_id_fields = ("payment",)


@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = ("business", "package", "period", "amount", "payment_method", "phone", "status",
                    "receipt_number", "created_at")
    list_filter = ("status", "payment_method", "period")
    search_fields = ("business__name", "phone", "receipt_number", "idempotency_key")
    readonly_fields = ("idempotency_key", "raw_response", "created_at", "updated_at")
