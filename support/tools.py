from orders.models import Order
from django.utils import timezone


def get_order_details(order_id):
    try:
        order = Order.objects.prefetch_related(
            "items__product"
        ).get(pk=order_id)
    except (Order.DoesNotExist, TypeError, ValueError):
        return f"Order with id {order_id} does not exist"

    return {
        # -------------------
        # Order Details
        # -------------------
        "order_id": order.pk,
        "order_tracking_number": order.tracking_number,
        "order_date": order.created_at.strftime("%Y-%m-%d"),
        "order_status": order.status,
        "order_carrier": order.carrier,
        "order_date_since_days": (timezone.now() - order.created_at).days,

        # -------------------
        # Customer Details
        # -------------------
        "customer_phone": order.customer_phone,
        "customer_shipping_address": order.shipping_address,
        "total_amount": str(order.total_amount),

        # -------------------
        # Order Items
        # -------------------
        "order_items": [
            {
                "product_name": item.product.name,
                "product_price": str(item.price),
                "product_quantity": item.quantity,
            }
            for item in order.items.all()
        ],
    }
