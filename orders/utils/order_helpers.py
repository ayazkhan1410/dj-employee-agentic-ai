from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from orders.models import Order, OrderItem, Product
from orders.utils.choices import Carrier, OrderStatus


ORDER_WRITE_FIELDS = (
    "carrier",
    "tracking_number",
    "shipping_address",
    "customer_phone",
    "total_amount",
    "status",
)

ALLOWED_ORDERING = {
    "id",
    "-id",
    "total_amount",
    "-total_amount",
    "status",
    "-status",
    "carrier",
    "-carrier",
    "created_at",
    "-created_at",
    "updated_at",
    "-updated_at",
}


def filter_and_sort_orders(queryset, query_params):
    """Custom order filtering/search/sorting from request query params."""
    status = query_params.get("status")
    if status:
        queryset = queryset.filter(status=status)

    carrier = query_params.get("carrier")
    if carrier:
        queryset = queryset.filter(carrier=carrier)

    tracking_number = query_params.get("tracking_number")
    if tracking_number:
        queryset = queryset.filter(tracking_number__icontains=tracking_number)

    shipping_address = query_params.get("shipping_address")
    if shipping_address:
        queryset = queryset.filter(shipping_address__icontains=shipping_address)

    customer_phone = query_params.get("customer_phone")
    if customer_phone:
        queryset = queryset.filter(customer_phone__icontains=customer_phone)

    min_total = query_params.get("min_total")
    if min_total not in (None, ""):
        queryset = queryset.filter(total_amount__gte=min_total)

    max_total = query_params.get("max_total")
    if max_total not in (None, ""):
        queryset = queryset.filter(total_amount__lte=max_total)

    created_after = query_params.get("created_after")
    if created_after:
        queryset = queryset.filter(created_at__gte=created_after)

    created_before = query_params.get("created_before")
    if created_before:
        queryset = queryset.filter(created_at__lte=created_before)

    search = query_params.get("search")
    if search:
        queryset = queryset.filter(
            Q(tracking_number__icontains=search)
            | Q(shipping_address__icontains=search)
            | Q(customer_phone__icontains=search)
        )

    ordering = query_params.get("ordering", "-created_at")
    if ordering in ALLOWED_ORDERING:
        queryset = queryset.order_by(ordering)
    else:
        queryset = queryset.order_by("-created_at")

    return queryset


def validate_filter_values(query_params):
    """Return an error message if status/carrier query values are invalid."""
    status = query_params.get("status")
    if status and status not in OrderStatus.values:
        return "Invalid status filter."

    carrier = query_params.get("carrier")
    if carrier and carrier not in Carrier.values:
        return "Invalid carrier filter."

    return None


def get_user_orders(user):
    return (
        Order.objects.filter(user=user)
        .prefetch_related("items", "items__product")
        .order_by("-created_at")
    )


def get_user_order(user, pk):
    return get_object_or_404(
        Order.objects.prefetch_related("items", "items__product"),
        pk=pk,
        user=user,
    )


def order_item_to_dict(item):
    return {
        "id": item.id,
        "product": item.product_id,
        "product_name": item.product.name if item.product_id else None,
        "quantity": item.quantity,
        "price": str(item.price),
        "created_at": item.created_at.isoformat(),
        "updated_at": item.updated_at.isoformat(),
    }


def order_to_dict(order):
    return {
        "id": order.id,
        "carrier": order.carrier,
        "carrier_display": order.get_carrier_display() if order.carrier else None,
        "tracking_number": order.tracking_number,
        "shipping_address": order.shipping_address,
        "customer_phone": order.customer_phone,
        "total_amount": str(order.total_amount),
        "status": order.status,
        "status_display": order.get_status_display(),
        "items": [order_item_to_dict(item) for item in order.items.all()],
        "created_at": order.created_at.isoformat(),
        "updated_at": order.updated_at.isoformat(),
    }


def orders_to_list(queryset):
    return [order_to_dict(order) for order in queryset]


def _order_kwargs_from_data(data):
    kwargs = {}
    for field in ORDER_WRITE_FIELDS:
        if field in data:
            kwargs[field] = data[field]
    if "status" not in kwargs:
        kwargs["status"] = OrderStatus.PENDING
    return kwargs


def _sync_order_items(order, items_data):
    if items_data is None:
        return
    order.items.all().delete()
    for item in items_data:
        product = get_object_or_404(Product, pk=item["product"])
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=item.get("quantity", 1),
            price=item["price"],
        )


@transaction.atomic
def create_order_for_user(user, validated_data):
    data = dict(validated_data)
    items_data = data.pop("items", None)
    order = Order.objects.create(user=user, **_order_kwargs_from_data(data))
    _sync_order_items(order, items_data)
    return get_user_order(user, order.pk)


@transaction.atomic
def update_order_for_user(order, validated_data, *, partial=False):
    data = dict(validated_data)
    items_data = data.pop("items", None)
    if partial:
        for field, value in data.items():
            if field in ORDER_WRITE_FIELDS:
                setattr(order, field, value)
    else:
        for field in ORDER_WRITE_FIELDS:
            if field in data:
                setattr(order, field, data[field])
            elif field == "status":
                setattr(order, field, OrderStatus.PENDING)
            elif field != "total_amount":
                setattr(order, field, None)
        if "total_amount" in data:
            order.total_amount = data["total_amount"]
    order.save()
    if items_data is not None:
        _sync_order_items(order, items_data)
    return get_user_order(order.user, order.pk)


def delete_order(order):
    order_id = order.pk
    order.delete()
    return order_id
