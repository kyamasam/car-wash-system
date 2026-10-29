from django.contrib import admin
from commons.admin_filters import business_filter, branch_filter
from billing.models import Payment, CommissionPayout, CommissionEntry, Expense, ExpenseCategory


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("job", "amount", "method", "type", "payer_phone", "paid_at", "branch")
    list_filter = (business_filter("branch__business"), branch_filter(), "method", "type")
    list_select_related = ("job", "branch")
    search_fields = ("job__job_number", "transaction_code", "payer_phone")


@admin.register(CommissionPayout)
class CommissionPayoutAdmin(admin.ModelAdmin):
    list_display = ("worker", "amount", "method", "period_start", "period_end", "paid_at", "branch")
    list_filter = (business_filter("branch__business"), branch_filter(), "method")
    list_select_related = ("worker", "branch")
    search_fields = ("worker__name",)


@admin.register(CommissionEntry)
class CommissionEntryAdmin(admin.ModelAdmin):
    list_display = ("worker", "amount", "type", "status", "earned_at", "payout", "branch")
    list_filter = (business_filter("branch__business"), branch_filter(), "type", "status")
    list_select_related = ("worker", "branch", "payout")
    search_fields = ("worker__name",)


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "business", "is_active", "created_at")
    list_filter = (business_filter(), "is_active")
    search_fields = ("name",)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "amount", "method", "incurred_on", "branch")
    list_filter = (business_filter("branch__business"), branch_filter(), "category", "method")
    list_select_related = ("category", "branch")
    search_fields = ("name", "category__name", "description")
    autocomplete_fields = ("category",)
