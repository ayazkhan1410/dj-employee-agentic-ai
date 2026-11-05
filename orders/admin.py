from django.contrib import admin

from orders.models import Category, Product, Order, OrderItem, RefundRequest


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "description", "created_at", "updated_at")
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")
    fields = ("name", "description", "created_at", "updated_at")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "category",
        "price",
        "in_stock",
        "description",
        "created_at",
        "updated_at",
    )
    list_filter = ("in_stock", "category")
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")
    fields = (
        "category",
        "name",
        "description",
        "price",
        "in_stock",
        "created_at",
        "updated_at",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user_id",
        "status",
        "carrier",
        "tracking_number",
        "shipping_address",
        "customer_phone",
        "total_amount",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "carrier")
    search_fields = (
        "tracking_number",
        "customer_phone",
        "user__id",
        "user__username",
        "user__email",
    )
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("user",)
    fields = (
        "user",
        "carrier",
        "tracking_number",
        "shipping_address",
        "customer_phone",
        "total_amount",
        "status",
        "created_at",
        "updated_at",
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "product",
        "quantity",
        "price",
        "created_at",
        "updated_at",
    )
    list_filter = ("order",)
    search_fields = ("product__name",)
    readonly_fields = ("created_at", "updated_at")
    fields = ("order", "product", "quantity", "price", "created_at", "updated_at")


@admin.register(RefundRequest)
class RefundRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "status",
        "reason",
        "created_at",
        "updated_at",
    )
    list_filter = ("status",)
    search_fields = ("order__id", "reason")
    readonly_fields = ("created_at", "updated_at")
    fields = ("order", "reason", "status", "created_at", "updated_at")
