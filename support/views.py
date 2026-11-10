from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


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

        # TODO: Implement the logic to handle the user message

        return Response({
            "message": "Hello, world!"
        }, status=status.HTTP_200_OK)
