from rest_framework import serializers

from orders.utils.choices import Carrier, OrderStatus


class OrderItemValidationSerializer(serializers.Serializer):
    product = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, default=1)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)


class OrderValidationSerializer(serializers.Serializer):
    """Validation only — persistence is handled by ORM helpers."""

    carrier = serializers.ChoiceField(
        choices=Carrier.choices, required=False, allow_null=True, allow_blank=True
    )
    tracking_number = serializers.CharField(
        max_length=255, required=False, allow_null=True, allow_blank=True
    )
    shipping_address = serializers.CharField(
        max_length=255, required=False, allow_null=True, allow_blank=True
    )
    customer_phone = serializers.CharField(
        max_length=255, required=False, allow_null=True, allow_blank=True
    )
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.ChoiceField(
        choices=OrderStatus.choices, required=False, default=OrderStatus.PENDING
    )
    items = OrderItemValidationSerializer(many=True, required=False)

    def validate_status(self, value):
        if value not in OrderStatus.values:
            raise serializers.ValidationError("Invalid order status.")
        return value

    def validate_carrier(self, value):
        if value in (None, ""):
            return value
        if value not in Carrier.values:
            raise serializers.ValidationError("Invalid carrier.")
        return value
