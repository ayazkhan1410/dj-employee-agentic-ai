from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from orders.models import Category, Order, OrderItem, Product, RefundRequest
from orders.utils.choices import Carrier, OrderStatus, RefundStatus

DEMO_USERS = [
    {
        "name": "Alice Khan",
        "email": "alice@example.com",
        "password": "alice1234",
        "phone": "+92-300-1111111",
        "address": "12 Gulshan Avenue, Karachi",
    },
    {
        "name": "Bob Ahmed",
        "email": "bob@example.com",
        "password": "bob1234",
        "phone": "+92-300-2222222",
        "address": "45 Clifton Block 5, Karachi",
    },
    {
        "name": "Cara Malik",
        "email": "cara@example.com",
        "password": "cara1234",
        "phone": "+92-300-3333333",
        "address": "78 DHA Phase 6, Karachi",
    },
]


class Command(BaseCommand):
    help = "Create admin, demo users, catalog, and orders if missing."

    def handle(self, *args, **options):
        with transaction.atomic():
            admin = self._ensure_admin()
            demo_users = self._ensure_demo_users()
            categories = self._ensure_categories()
            products = self._ensure_products(categories)
            self._ensure_orders(
                admin,
                products,
                phone="+92-300-0000000",
                address="123 Demo Street, Karachi",
                order_specs=self._admin_order_specs(),
                label="admin",
            )
            for index, demo in enumerate(demo_users):
                self._ensure_orders(
                    demo["user"],
                    products,
                    phone=demo["phone"],
                    address=demo["address"],
                    order_specs=self._user_order_specs(index),
                    label=demo["email"],
                )
        self.stdout.write(self.style.SUCCESS("Demo data is ready."))
        self.stdout.write("")
        self.stdout.write("Login accounts:")
        self.stdout.write("  admin@example.com / 1234  (also Django admin: admin / 1234)")
        for demo in DEMO_USERS:
            self.stdout.write(f"  {demo['email']} / {demo['password']}")

    def _ensure_admin(self):
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@example.com",
                "first_name": "Admin",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.email = "admin@example.com"
        admin.first_name = "Admin"
        admin.is_staff = True
        admin.is_superuser = True
        admin.set_password("1234")
        admin.save()
        action = "Created" if created else "Updated"
        self.stdout.write(f"{action} superuser admin / 1234 (email: admin@example.com)")
        return admin

    def _ensure_demo_users(self):
        users = []
        for demo in DEMO_USERS:
            email = demo["email"]
            parts = demo["name"].split(None, 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""
            user, created = User.objects.get_or_create(
                username=email,
                defaults={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                },
            )
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.set_password(demo["password"])
            user.save()
            action = "Created" if created else "Updated"
            self.stdout.write(f"{action} user {email} / {demo['password']}")
            users.append(
                {
                    "user": user,
                    "email": email,
                    "phone": demo["phone"],
                    "address": demo["address"],
                }
            )
        return users

    def _ensure_categories(self):
        specs = [
            ("Electronics", "Phones, laptops, and accessories"),
            ("Clothing", "Everyday wear and seasonal apparel"),
            ("Home", "Kitchen and living essentials"),
        ]
        categories = {}
        for name, description in specs:
            category, _ = Category.objects.get_or_create(
                name=name,
                defaults={"description": description},
            )
            categories[name] = category
        self.stdout.write(f"Categories ready: {len(categories)}")
        return categories

    def _ensure_products(self, categories):
        specs = [
            ("Electronics", "Wireless Headphones", "Noise-cancelling over-ear", "129.99"),
            ("Electronics", "USB-C Hub", "7-in-1 multiport adapter", "49.99"),
            ("Electronics", "Smartphone Stand", "Adjustable aluminum stand", "24.50"),
            ("Clothing", "Cotton T-Shirt", "Unisex medium weight tee", "19.99"),
            ("Clothing", "Denim Jacket", "Classic blue jacket", "79.00"),
            ("Clothing", "Running Socks", "3-pack cushioned socks", "14.50"),
            ("Home", "Ceramic Mug", "12oz matte finish mug", "12.00"),
            ("Home", "Desk Lamp", "LED lamp with dimmer", "39.99"),
            ("Home", "Storage Basket", "Woven medium basket", "22.00"),
        ]
        products = []
        for category_name, name, description, price in specs:
            product, _ = Product.objects.get_or_create(
                name=name,
                defaults={
                    "category": categories[category_name],
                    "description": description,
                    "price": Decimal(price),
                    "in_stock": True,
                },
            )
            products.append(product)
        self.stdout.write(f"Products ready: {len(products)}")
        return products

    def _admin_order_specs(self):
        return [
            {
                "days_ago": 1,
                "status": OrderStatus.PENDING,
                "carrier": None,
                "tracking": None,
                "items": [(0, 1), (3, 2)],
                "refund": None,
            },
            {
                "days_ago": 3,
                "status": OrderStatus.PROCESSING,
                "carrier": Carrier.UPS,
                "tracking": "UPS123456",
                "items": [(1, 1), (6, 1)],
                "refund": None,
            },
            {
                "days_ago": 5,
                "status": OrderStatus.SHIPPED,
                "carrier": Carrier.DHL,
                "tracking": "DHL987654",
                "items": [(4, 1)],
                "refund": None,
            },
            {
                "days_ago": 8,
                "status": OrderStatus.DELIVERED,
                "carrier": Carrier.FEDEX,
                "tracking": "FDX555111",
                "items": [(2, 1), (7, 1), (8, 2)],
                "refund": None,
            },
            {
                "days_ago": 10,
                "status": OrderStatus.DELIVERED,
                "carrier": Carrier.USPS,
                "tracking": "USPS778899",
                "items": [(5, 3)],
                "refund": {
                    "reason": "Wrong size received",
                    "status": RefundStatus.PENDING,
                },
            },
            {
                "days_ago": 14,
                "status": OrderStatus.CANCELLED,
                "carrier": Carrier.OTHER,
                "tracking": None,
                "items": [(0, 1)],
                "refund": {
                    "reason": "Changed mind before shipping",
                    "status": RefundStatus.APPROVED,
                },
            },
        ]

    def _user_order_specs(self, user_index):
        # Three varied orders per demo user.
        offsets = user_index * 2
        return [
            {
                "days_ago": 2 + offsets,
                "status": OrderStatus.PENDING,
                "carrier": None,
                "tracking": None,
                "items": [(user_index % 9, 1), ((user_index + 3) % 9, 2)],
                "refund": None,
            },
            {
                "days_ago": 6 + offsets,
                "status": OrderStatus.SHIPPED,
                "carrier": [Carrier.DHL, Carrier.UPS, Carrier.FEDEX][user_index % 3],
                "tracking": f"TRK-{user_index + 1}-SHIP",
                "items": [((user_index + 1) % 9, 1)],
                "refund": None,
            },
            {
                "days_ago": 12 + offsets,
                "status": OrderStatus.DELIVERED,
                "carrier": [Carrier.USPS, Carrier.OTHER, Carrier.DHL][user_index % 3],
                "tracking": f"TRK-{user_index + 1}-DONE",
                "items": [((user_index + 4) % 9, 1), ((user_index + 7) % 9, 1)],
                "refund": (
                    {
                        "reason": "Item arrived damaged",
                        "status": RefundStatus.PENDING,
                    }
                    if user_index == 1
                    else None
                ),
            },
        ]

    def _ensure_orders(self, user, products, *, phone, address, order_specs, label):
        existing = Order.objects.filter(user=user).count()
        if existing > 0:
            self.stdout.write(
                f"Orders already present for {label} ({existing}); skipping."
            )
            return

        now = timezone.now()
        created = 0
        for spec in order_specs:
            selected = []
            total = Decimal("0.00")
            for product_index, quantity in spec["items"]:
                product = products[product_index]
                line_total = product.price * quantity
                total += line_total
                selected.append((product, quantity, product.price))

            created_at = now - timedelta(days=spec["days_ago"])
            order = Order.objects.create(
                user=user,
                carrier=spec["carrier"],
                tracking_number=spec["tracking"],
                shipping_address=address,
                customer_phone=phone,
                total_amount=total,
                status=spec["status"],
            )
            Order.objects.filter(pk=order.pk).update(
                created_at=created_at,
                updated_at=created_at,
            )

            for product, quantity, price in selected:
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=price,
                )

            if spec["refund"]:
                RefundRequest.objects.create(
                    order=order,
                    reason=spec["refund"]["reason"],
                    status=spec["refund"]["status"],
                )
            created += 1

        self.stdout.write(f"Created {created} demo orders for {label}.")
