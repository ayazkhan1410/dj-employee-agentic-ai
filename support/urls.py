from django.urls import path

from support.views import ChatSupportAPIView

urlpatterns = [
    path(
        "chat/", ChatSupportAPIView.as_view(),
        name="chat-support-api"
    ),
    path(
        "chat/<int:pk>/", ChatSupportAPIView.as_view(),
        name="chat-support-api-detail"
    ),
]
