from django.contrib import admin

from support.models import AgentLog, Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user_id", "order_id", "created_at", "updated_at")
    list_filter = ("created_at",)
    search_fields = ("title", "user__id", "user__email", "user__username")
    readonly_fields = ("created_at", "updated_at")
    fields = ("title", "user", "order", "created_at", "updated_at")
    raw_id_fields = ("user", "order")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "role", "created_at", "updated_at")
    list_filter = ("role", "created_at")
    search_fields = ("content", "conversation__title")
    readonly_fields = ("created_at", "updated_at")
    fields = ("conversation", "role", "content", "created_at", "updated_at")
    raw_id_fields = ("conversation",)


@admin.register(AgentLog)
class AgentLogAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "event_type", "created_at", "updated_at")
    list_filter = ("event_type", "created_at")
    search_fields = ("content", "conversation__title")
    readonly_fields = ("created_at", "updated_at")
    fields = ("conversation", "event_type", "content", "created_at", "updated_at")
    raw_id_fields = ("conversation",)
