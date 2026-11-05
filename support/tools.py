from django.utils import timezone

from orders.models import Order, RefundRequest


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


def get_refund_history(user_id):
    try:
        refund_requests = (
            RefundRequest.objects.filter(order__user_id=user_id)
            .select_related("order")
            .prefetch_related("order__items__product")
            .order_by("-created_at")
        )

        history = [
            {
                # -------------------
                # Refund Request Details
                # -------------------
                "refund_request_id": refund_request.pk,
                "refund_request_date": refund_request.created_at.strftime(
                    "%Y-%m-%d"
                ),
                "refund_request_status": refund_request.status,
                "refund_request_reason": refund_request.reason,

                # -------------------
                # Order Details
                # -------------------
                "refund_request_order_id": refund_request.order.pk,
                "refund_request_product_names": [
                    item.product.name
                    for item in refund_request.order.items.all()
                ],
            }
            for refund_request in refund_requests
        ]
        return {
            "total_refund_requests": len(history),
            "refund_requests": history,
        }
    except Exception as e:
        return f"Error getting refund history: {e}"


def check_delivery_status(tracking_number):
    try:
        order = Order.objects.get(tracking_number=tracking_number)
    except (Order.DoesNotExist, TypeError, ValueError):
        return f"Order with tracking number {tracking_number} does not exist"
    except Exception as e:
        return f"Error checking delivery status: {e}"

    return {
        "tracking_number": order.tracking_number,
        "carrier": order.carrier,
        "delivery_status": order.status,
        "last_updated": order.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
    }
