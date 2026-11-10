from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from orders.utils.choices import Role
from support.agent import support_agent_tool
from support.models import Conversation, Message


class ChatSupportAPIView(APIView):
    def get(self, request, pk=None):
        return Response({
            "message": "Hello, world!"
        }, status=status.HTTP_200_OK)

    def post(self, request):
        user_message = request.data.get("message")
        if not user_message:
            return Response({
                "message": "Message is required"
            }, status=status.HTTP_400_BAD_REQUEST)

        # TODO: Implement the logic to handle the user message

        return Response({
            "message": "Hello, world!"
        }, status=status.HTTP_200_OK)


class ChatSupportOrderDetailAPIView(APIView):
    def get(self, request, order_id):
        return Response({
            "message": "Hello, world!"
        }, status=status.HTTP_200_OK)

    def post(self, request, order_id):
        user_message = request.data.get("message")
        if not user_message:
            return Response({
                "message": "Message is required"
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            order = get_object_or_404(
                Order.objects.select_for_update(),
                id=order_id,
                user=request.user,
            )

            conversation = (
                Conversation.objects.select_for_update()
                .filter(order=order, user=request.user)
                .order_by("id")
                .first()
            )
            if conversation is None:
                conversation = Conversation.objects.create(
                    order=order,
                    user=request.user,
                    title=user_message[:255],
                )

            Message.objects.create(
                conversation=conversation,
                content=user_message,
                role=Role.USER,
            )

        # Sending message to the AI
        ai_response = support_agent_tool(
            user_message,
            conversation_id=conversation.id,
        )

        # Saving the AI response
        Message.objects.create(
            conversation=conversation,
            content=ai_response,
            role=Role.MODEL,
        )

        return Response(
            {
                "message": ai_response,
                "conversation_id": conversation.id,
                "order_id": order.id,
            },
            status=status.HTTP_200_OK,
        )
