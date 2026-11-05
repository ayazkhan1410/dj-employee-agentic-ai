from collections import Counter
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone

from orders.models import Order
from orders.utils.choices import Carrier, OrderStatus
from orders.utils.order_helpers import order_to_dict


def build_user_dashboard(user):
    """Build chart-ready dashboard stats for the authenticated user."""
    orders = Order.objects.filter(user=user)
    totals = orders.aggregate(
        order_count=Count("id"),
        revenue=Sum("total_amount"),
    )

    status_rows = {
        row["status"]: row["total"]
        for row in orders.values("status").annotate(total=Count("id"))
    }
    status_chart = [
        {
            "key": key,
            "label": label,
            "value": status_rows.get(key, 0),
        }
        for key, label in OrderStatus.choices
    ]

    carrier_rows = {
        row["carrier"]: row["total"]
        for row in orders.exclude(carrier__isnull=True)
        .exclude(carrier="")
        .values("carrier")
        .annotate(total=Count("id"))
    }
    carrier_chart = [
        {
            "key": key,
            "label": label,
            "value": carrier_rows.get(key, 0),
        }
        for key, label in Carrier.choices
        if carrier_rows.get(key, 0) > 0
    ]

    today = timezone.localdate()
    start = today - timedelta(days=6)
    start_dt = timezone.make_aware(datetime.combine(start, time.min))
    daily_counts = Counter()
    for created_at in orders.filter(created_at__gte=start_dt).values_list(
        "created_at", flat=True
    ):
        local_day = timezone.localtime(created_at).date()
        daily_counts[local_day] += 1

    volume_chart = []
    for offset in range(7):
        day = start + timedelta(days=offset)
        volume_chart.append(
            {
                "date": day.isoformat(),
                "label": day.strftime("%a"),
                "value": daily_counts.get(day, 0),
            }
        )

    recent_orders = [
        order_to_dict(order)
        for order in orders.prefetch_related("items", "items__product").order_by(
            "-created_at"
        )[:5]
    ]

    revenue = totals["revenue"] or Decimal("0.00")
    return {
        "summary": {
            "order_count": totals["order_count"] or 0,
            "revenue": str(revenue),
            "pending_count": status_rows.get(OrderStatus.PENDING, 0),
            "processing_count": status_rows.get(OrderStatus.PROCESSING, 0),
            "shipped_count": status_rows.get(OrderStatus.SHIPPED, 0),
            "delivered_count": status_rows.get(OrderStatus.DELIVERED, 0),
            "cancelled_count": status_rows.get(OrderStatus.CANCELLED, 0),
        },
        "charts": {
            "status": status_chart,
            "carriers": carrier_chart,
            "volume": volume_chart,
        },
        "recent_orders": recent_orders,
        "account": {
            "id": user.id,
            "name": user.get_full_name() or user.username,
            "email": user.email,
            "date_joined": user.date_joined.isoformat(),
        },
    }
