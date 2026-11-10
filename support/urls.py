from django.urls import path

from support.views import (
    ChatSupportAPIView, ChatSupportOrderDetailAPIView
)

urlpatterns = [
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
