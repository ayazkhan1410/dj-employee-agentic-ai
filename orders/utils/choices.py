from django.db import models


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    SHIPPED = "shipped", "Shipped"
    DELIVERED = "delivered", "Delivered"
    CANCELLED = "cancelled", "Cancelled"


class Carrier(models.TextChoices):
    DHL = "dhl", "DHL"
    UPS = "ups", "UPS"
    FEDEX = "fedex", "Fedex"
    USPS = "usps", "USPS"
    OTHER = "other", "Other"


class RefundStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
