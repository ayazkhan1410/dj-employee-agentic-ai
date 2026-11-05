import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_employee.pagination import paginate_queryset
from orders.serializers import OrderValidationSerializer
from orders.utils.order_helpers import (
    create_order_for_user,
    delete_order,
    filter_and_sort_orders,
    get_user_order,
    get_user_orders,
    order_to_dict,
    orders_to_list,
    update_order_for_user,
    validate_filter_values,
)

logger = logging.getLogger(__name__)


# -------------------------
# List / Create Orders
# -------------------------
class OrderListCreateAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    # -------------------------
    # Fetching Order data
    # -------------------------
    def get(self, request):
        logger.info(
            "Listing orders user_id=%s query=%s",
            request.user.id,
            dict(request.query_params),
        )

        filter_error = validate_filter_values(request.query_params)
        if filter_error:
            return Response(
                {"detail": filter_error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = filter_and_sort_orders(
            get_user_orders(request.user),
            request.query_params,
        )
        paginator, page = paginate_queryset(request, queryset, view=self)
        data = orders_to_list(page if page is not None else queryset)

        if page is not None:
            return paginator.get_paginated_response(data)

        return Response(data)

    # -------------------------
    # Creating Order data
    # -------------------------
    def post(self, request):
        logger.info(
            "Creating order user_id=%s payload=%s",
            request.user.id,
            request.data,
        )

        serializer = OrderValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = create_order_for_user(request.user, serializer.validated_data)
        logger.info("Order created id=%s user_id=%s", order.id, request.user.id)

        return Response(order_to_dict(order), status=status.HTTP_201_CREATED)


# -------------------------
# Order Detail CRUD
# -------------------------
class OrderDetailAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    # -------------------------
    # Fetching single Order
    # -------------------------
    def get(self, request, pk):
        logger.info("Retrieve order id=%s user_id=%s", pk, request.user.id)

        order = get_user_order(request.user, pk)
        return Response(order_to_dict(order))

    # -------------------------
    # Updating Order data
    # -------------------------
    def put(self, request, pk):
        logger.info(
            "Update order id=%s user_id=%s payload=%s",
            pk,
            request.user.id,
            request.data,
        )

        order = get_user_order(request.user, pk)
        serializer = OrderValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = update_order_for_user(
            order,
            serializer.validated_data,
            partial=False,
        )
        logger.info("Order updated id=%s", order.id)

        return Response(order_to_dict(order))

    def patch(self, request, pk):
        logger.info(
            "Partial update order id=%s user_id=%s payload=%s",
            pk,
            request.user.id,
            request.data,
        )

        order = get_user_order(request.user, pk)
        serializer = OrderValidationSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        order = update_order_for_user(
            order,
            serializer.validated_data,
            partial=True,
        )
        logger.info("Order patched id=%s", order.id)

        return Response(order_to_dict(order))

    # -------------------------
    # Deleting Order data
    # -------------------------
    def delete(self, request, pk):
        logger.info("Delete order id=%s user_id=%s", pk, request.user.id)

        order = get_user_order(request.user, pk)
        deleted_id = delete_order(order)
        logger.info("Order deleted id=%s", deleted_id)

        return Response(status=status.HTTP_204_NO_CONTENT)
