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
  reply with a short Benjamin welcome. Example:
  "Hi! Welcome to AI Employee customer support — I'm Benjamin.
  How can I help you today?"
- Do not restart with a full welcome on every later message.
- No corporate filler ("I'm your AI helper…", "I can assist with…").
- Do not use emojis.

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

# Support Tools (Gemini format)
SUPPORT_TOOLS = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="get_order_details",
                description="Get order details by order ID.",
                parameters={
                    "type": "object",
                    "properties": {
                        "order_id": {"type": "integer"},
                    },
                    "required": ["order_id"],
                },
            ),
            types.FunctionDeclaration(
                name="check_delivery_status",
                description="Check delivery status by tracking number.",
                parameters={
                    "type": "object",
                    "properties": {
                        "tracking_number": {"type": "string"},
                    },
                    "required": ["tracking_number"],
                },
            ),
            types.FunctionDeclaration(
                name="get_refund_history",
                description="Get refund history by user ID.",
                parameters={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "integer"},
                    },
                    "required": ["user_id"],
                },
            ),
        ]
    )
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
def support_agent_tool(user_message, conversation_id, order_id, user_id):
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

    # Build contents once so tool results can be appended in the loop.
    contents = [
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
    ]

    # Send conversation to Gemini
    while True:
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(
                # Tells the model its job/rules
                system_instruction=(
                    SUPPORT_SYSTEM_PROMPT
                    + f"\n\nThis conversation is about the order "
                    f"{order_id} and the user {user_id}"
                ),
                tools=SUPPORT_TOOLS,
            ),
        )

        print("RESPONSE FROM GEMINI ========== ", response.json())
        print("STOP REASON ========== ", response.candidates[0].finish_reason)

        part = response.candidates[0].content.parts[0]
        print("PART ========== ", part)
        if part.function_call:
            tool_name = part.function_call.name
            print("TOOL NAME ========== ", tool_name)
            tool_input = dict(part.function_call.args or {})
            print("TOOL INPUT ========== ", tool_input)
            result = execute_tool(tool_name, tool_input)
            print("RESULT ========== ", result)

            # Keep model tool call, then send tool result back to Gemini.
            contents.append(response.candidates[0].content)
            contents.append(
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_function_response(
                            name=tool_name,
                            response={"result": result},
                        )
                    ],
                )
            )
            continue

        return response.text or (
            "Sorry, I could not generate a reply. Please try again."
        )

