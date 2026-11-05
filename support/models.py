from django.db import models

from django.contrib.auth.models import User

from orders.models import Order, TimeStampedModel
from orders.utils.choices import Event, Role


class Conversation(TimeStampedModel):
    title = models.CharField(max_length=255, null=True, blank=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="conversations"
    )
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="conversations",
        null=True, blank=True
    )


class Message(TimeStampedModel):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=255, choices=Role.choices)
    content = models.TextField()


class AgentLog(TimeStampedModel):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="agent_logs",
        null=True, blank=True
    )
    event_type = models.CharField(max_length=255, choices=Event.choices)
    content = models.TextField(null=True, blank=True)
