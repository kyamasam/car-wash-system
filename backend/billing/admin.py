from django.contrib import admin
from billing.models import Payment, CommissionPayout, CommissionEntry, Expense


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("job", "amount", "method", "type", "payer_phone", "paid_at", "branch")
    list_filter = ("method", "type", "branch")
    search_fields = ("job__job_number", "transaction_code", "payer_phone")


@admin.register(CommissionPayout)
class CommissionPayoutAdmin(admin.ModelAdmin):
    list_display = ("worker", "amount", "method", "period_start", "period_end", "paid_at")
    list_filter = ("method", "branch")
    search_fields = ("worker__name",)


@admin.register(CommissionEntry)
class CommissionEntryAdmin(admin.ModelAdmin):
    list_display = ("worker", "amount", "type", "status", "earned_at", "payout")
    list_filter = ("type", "status", "branch")
    search_fields = ("worker__name",)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("category", "amount", "method", "incurred_on", "branch")
    list_filter = ("category", "method", "branch")
    search_fields = ("category", "description")
