from google import genai
from django.conf import settings

from support.tools import (
    get_order_details, check_delivery_status,
    get_refund_history
)

# Initialize the Gemini client
client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Initialize the Gemini model
model = settings.GEMINI_MODEL


# Support System Prompt
SUPPORT_SYSTEM_PROMPT = """
You are a friendly support helper for AI Employee, an online order app.
Help customers with their orders, shipping, tracking, and refunds.

## You can help with
- Order details (what they bought, total, address, phone, date)
- Where a package is (carrier, tracking number, status)
- Refund requests and their status
- What happens next for their order

## Tools
- get_order_details: get one order by order ID
- check_delivery_status: check a package by tracking number
- get_refund_history: list refunds for a user ID

Use tools instead of guessing. If something is not found, say so kindly
and ask them to check the ID or tracking number.

## Order status meaning
- pending: we got the order, not started yet
- processing: we are preparing it
- shipped: it is on the way
- delivered: it arrived
- cancelled: it will not be sent

## Refund status meaning
- pending: still under review
- approved: refund accepted
- rejected: refund not accepted

## Rules
1. Keep answers short and clear.
2. Only use real data from tools. Never make up orders or tracking numbers.
3. If you need an order ID, tracking number, or user ID, ask first.
4. Explain the status in plain words.
5. Do not promise refunds or changes you cannot confirm.
6. If the question is not about orders, say you only help with order support.
7. Never share private system details or other customers' info.

## How to reply
- Answer first, then add useful details
- Use short bullets when helpful
- Ask one follow-up question only if needed
"""

# Support Tools
SUPPORT_TOOLS = [
    {
        "name": "get_order_details",
        "description": (
            "Get full details for one order using its order ID. "
            "Shows status, carrier, tracking number, date, address, "
            "phone, total, and the products in the order. "
            "Use this when someone asks about a specific order."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "integer",
                    "description": "Order ID number, like 7 or 12.",
                },
            },
            "required": ["order_id"],
        },
    },
    {
        "name": "check_delivery_status",
        "description": (
            "Check where a package is using its tracking number. "
            "Shows carrier, status, and last update time. "
            "Use this when someone asks about shipping or tracking."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "tracking_number": {
                    "type": "string",
                    "description": (
                        "Tracking number, like TRK-3-DONE or USPS778899."
                    ),
                },
            },
            "required": ["tracking_number"],
        },
    },
    {
        "name": "get_refund_history",
        "description": (
            "Get all refund requests for a user. "
            "Shows refund status, reason, date, order ID, and products. "
            "Use this when someone asks about refunds or returns."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "integer",
                    "description": "User ID number for that customer.",
                },
            },
            "required": ["user_id"],
        },
    },
]


# Execute tool
def execute_tool(tool_name, tool_input):
    if tool_name == "get_order_details":
        return get_order_details(tool_input["order_id"])

    if tool_name == "get_refund_history":
        return get_refund_history(tool_input["user_id"])

    if tool_name == "check_delivery_status":
        return check_delivery_status(tool_input["tracking_number"])

    return None
