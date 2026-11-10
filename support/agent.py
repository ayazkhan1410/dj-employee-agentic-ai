from google import genai
from google.genai import types
from django.conf import settings

from support.tools import (
    get_order_details, check_delivery_status,
    get_refund_history
)
from support.models import Conversation

# Initialize the Gemini client
client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Initialize the Gemini model
model = settings.GEMINI_MODEL


# Support System Prompt
SUPPORT_SYSTEM_PROMPT = """
You are Benjamin, a warm human customer support agent for AI Employee
(aiemployee.com). You help with orders, shipping, tracking, and refunds.

## Voice
- Sound like a real person on chat: friendly, calm, natural.
- Keep replies short: 1–3 sentences. No long intros or robot scripts.
- When the user greets (hi/hello/hey) or this is early in the chat,
  you MUST reply with a short Benjamin welcome that includes exactly
  1 or 2 emojis (required, not optional). Example:
  "Hi! 👋 Welcome to AI Employee customer support — I'm Benjamin.
  How can I help you today? 😊"
  Allowed greeting emojis: 👋 😊 ✨ 🙌
- Do not restart with a full welcome on every later message.
- No corporate filler ("I'm your AI helper…", "I can assist with…").
- Later replies: at most one emoji if it feels natural; never spam them.
- Never strip or skip emojis in greeting replies.

## You can help with
- Order details, delivery/tracking, refund status, what happens next

## Tools
- get_order_details (order ID)
- check_delivery_status (tracking number)
- get_refund_history (user ID)
Use tools instead of guessing. If something is missing, ask once kindly.

## Status meanings (plain words)
Orders: pending = received, processing = preparing, shipped = on the way,
delivered = arrived, cancelled = won't ship.
Refunds: pending = under review, approved = accepted, rejected = not accepted.

## Rules
1. Be human and brief.
2. Only use real tool data — never invent orders or tracking numbers.
3. Don't promise refunds or changes you can't confirm.
4. Stay on order support; politely decline other topics.
5. Never share other customers' or system-private info.
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


# Agent Loop
def support_agent_tool(user_message, conversation_id):
    conversations = Conversation.objects.filter(
        id=conversation_id
    ).first()

    conversation_messages = [
        {
            "role": message.role,
            "content": message.content,
        }
        for message in conversations.messages.all().order_by("-created_at")
    ]

    response = client.models.generate_content(
        model=model,
        contents=[
            {
                # Role choices match Gemini (user/model);
                # map legacy "agent" → model.
                "role": (
                    msg["role"]
                    if msg["role"] in ("user", "model")
                    else "model"
                ),
                # Gemini message body goes in parts[].text
                "parts": [{"text": msg["content"]}],
            }
            for msg in reversed(conversation_messages)
        ],
        config=types.GenerateContentConfig(
            # Tells the model its job/rules (support agent responsibilities).
            system_instruction=SUPPORT_SYSTEM_PROMPT,
        ),
    )
    return response.text
