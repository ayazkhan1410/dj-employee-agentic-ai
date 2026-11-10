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


class Role(models.TextChoices):
    # Gemini content roles: user / model
    USER = "user", "User"
    MODEL = "model", "Model"


class Event(models.TextChoices):
    SUPPORT = "support", "Support Agent"
    TOOL_CALL = "tool_call", "Tool Call"
    TOOL_RESULT = "tool_result", "Tool Result"
    MANAGER = "manager", "Manager Agent"
    RISK = "risk", "Risk Agent"
    FINAL = "final", "Final Reply"
