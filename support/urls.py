from django.urls import path

from support.views import (
    AgentLogsDashboardAPIView,
    ChatSupportAPIView,
    ChatSupportOrderDetailAPIView,
)

urlpatterns = [
    path(
        "agent-logs/",
        AgentLogsDashboardAPIView.as_view(),
        name="agent-logs-dashboard",
    ),
    path(
        "chat/", ChatSupportAPIView.as_view(),
        name="chat-support-api"
    ),
    path(
        "chat/<int:order_id>/",
        ChatSupportOrderDetailAPIView.as_view(),
        name="chat-support-api-order-detail",
    ),
]
