from django.contrib import admin
from jobs.models import Job, JobItem


class JobItemInline(admin.TabularInline):
    model = JobItem
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("job_number", "branch", "status", "payment_status", "total_amount", "amount_paid", "checked_in_at")
    list_filter = ("status", "payment_status", "branch", "collection_method")
    search_fields = ("job_number", "customer__phone", "vehicle__plate_number")
    readonly_fields = ("job_number", "created_at", "updated_at")
    inlines = [JobItemInline]


@admin.register(JobItem)
class JobItemAdmin(admin.ModelAdmin):
    list_display = ("job", "service", "quantity", "unit_price", "line_total")
    search_fields = ("job__job_number", "service__name")
