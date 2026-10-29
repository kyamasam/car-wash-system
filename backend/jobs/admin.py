from django.contrib import admin
from commons.admin_filters import business_filter, branch_filter
from jobs.models import Job, JobItem


class JobItemInline(admin.TabularInline):
    model = JobItem
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("job_number", "branch", "status", "payment_status", "total_amount", "amount_paid", "checked_in_at")
    list_filter = (business_filter("branch__business"), branch_filter(), "status", "payment_status", "collection_method")
    list_select_related = ("branch",)
    search_fields = ("job_number", "customer__phone", "vehicle__plate_number")
    readonly_fields = ("job_number", "created_at", "updated_at")
    inlines = [JobItemInline]


@admin.register(JobItem)
class JobItemAdmin(admin.ModelAdmin):
    list_display = ("job", "service", "quantity", "unit_price", "line_total")
    list_filter = (business_filter("job__branch__business"), branch_filter("job__branch"))
    list_select_related = ("job", "service")
    search_fields = ("job__job_number", "service__name")
