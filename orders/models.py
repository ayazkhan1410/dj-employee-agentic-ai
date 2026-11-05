from django.db import models
from django.contrib.auth.models import User

from orders.utils.choices import (
    OrderStatus, Carrier, RefundStatus
)


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(TimeStampedModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)


class Product(TimeStampedModel):
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="products",
        null=True, blank=True
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    in_stock = models.BooleanField(default=True)


class Order(TimeStampedModel):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="orders"
    )
    carrier = models.CharField(
        max_length=255, choices=Carrier.choices,
        null=True, blank=True
    )
    tracking_number = models.CharField(max_length=255, null=True, blank=True)
    shipping_address = models.CharField(max_length=255, null=True, blank=True)
    customer_phone = models.CharField(max_length=255, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=255, choices=OrderStatus.choices,
        default=OrderStatus.PENDING
    )


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="order_items"
    )
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)


class RefundRequest(TimeStampedModel):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="refund_requests"
    )
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=255, choices=RefundStatus.choices,
        default=RefundStatus.PENDING
    )
