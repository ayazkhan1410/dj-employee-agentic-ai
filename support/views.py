from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class ChatSupportAPIView(APIView):
    def get(self, request, pk=None):
        return Response({
            "message": "Hello, world!"
        }, status=status.HTTP_200_OK)

    def post(self, request, pk=None):
        return Response({
            "message": "Hello, world!"
        }, status=status.HTTP_200_OK)
