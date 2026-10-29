from django.contrib import admin
from commons.admin_filters import business_filter, branch_filter
from workers.models import Worker


@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "branch", "is_commission_eligible", "is_active", "joined_at")
    list_filter = (business_filter("branch__business"), branch_filter(), "is_commission_eligible", "is_active")
    search_fields = ("name", "phone", "national_id")
