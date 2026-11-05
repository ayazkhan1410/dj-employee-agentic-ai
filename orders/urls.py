from django.urls import path

from orders.views import (
    DashboardAPIView,
    OrderDetailAPIView,
    OrderListCreateAPIView,
)

urlpatterns = [
    path("dashboard/", DashboardAPIView.as_view(), name="dashboard"),
    path("", OrderListCreateAPIView.as_view(), name="order-list-create"),
    path("<int:pk>/", OrderDetailAPIView.as_view(), name="order-detail"),
]
