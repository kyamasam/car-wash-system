from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "branch", "type", "is_read", "is_sent", "created_at")
    search_fields = ("title", "user__email", "type")
    list_filter = ("type", "is_read", "is_sent", "created_at")
    readonly_fields = ("id", "created_at", "sent_at", "read_at")
    ordering = ("-created_at",)
    list_per_page = 25
