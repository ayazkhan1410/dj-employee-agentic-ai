import json
import logging
import urllib.error
import urllib.request
from pathlib import Path

from django.conf import settings

from support.models import Conversation, Message
from support.tools import (
    check_delivery_status,
    get_order_details,
    get_refund_history,
)

logger = logging.getLogger(__name__)


def _log_section(title: str, *args) -> None:
    # Same clear block style as .env.example section headers.
    logger.info("-------------------------")
    logger.info(title, *args)
    logger.info("-------------------------")


# Support System Prompt (edit support/system_prompt.md)
SUPPORT_SYSTEM_PROMPT = (
    Path(__file__).with_name("system_prompt.md").read_text(encoding="utf-8")
)

# OpenRouter / OpenAI-style tools (simple dicts)
SUPPORT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_order_details",
            "description": "Get order details by order ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "integer"},
                },
                "required": ["order_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_delivery_status",
            "description": "Check delivery status by tracking number.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tracking_number": {"type": "string"},
                },
                "required": ["tracking_number"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_refund_history",
            "description": "Get refund history by user ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "integer"},
                },
                "required": ["user_id"],
            },
        },
    },
]


def execute_tool(tool_name, tool_input):
    _log_section("Tool call: %s", tool_name)
    logger.info("Tool input: %s", tool_input)

    if tool_name == "get_order_details":
        result = get_order_details(tool_input["order_id"])
    elif tool_name == "get_refund_history":
        result = get_refund_history(tool_input["user_id"])
    elif tool_name == "check_delivery_status":
        result = check_delivery_status(tool_input["tracking_number"])
    else:
        result = None

    _log_section("Tool finished: %s", tool_name)
    return result


def support_agent_tool(user_message, conversation_id, order_id, user_id):
    _log_section("Support agent start")
    logger.info("conversation_id=%s", conversation_id)
    logger.info("order_id=%s", order_id)
    logger.info("user_id=%s", user_id)

    # Step 1: load this conversation from DB
    conversation = Conversation.objects.filter(id=conversation_id).first()
    if conversation is None:
        _log_section("Conversation not found")
        logger.warning("conversation_id=%s", conversation_id)
        return "Sorry, I could not find this conversation."

    # Step 2: pick OpenRouter model from env (first in the list)
    model_name = (
        settings.LANDING_CHAT_MODELS.split(",")[0].strip()
        or "nvidia/nemotron-3.5-super-vl:free"
    )
    api_key = settings.LANDING_CHAT_SUPPORT_API_KEY
    if not api_key:
        raise ValueError("LANDING_CHAT_SUPPORT_API_KEY is not set")
    _log_section("OpenRouter model")
    logger.info("model=%s", model_name)

    # Step 3: load previous chat via Message query
    history = []
    past_messages = Message.objects.filter(
        conversation=conversation
    ).order_by("created_at")
    for message in past_messages:
        if not message.content:
            continue
        history.append(
            {
                "role": "user" if message.role == "user" else "assistant",
                "content": message.content,
            }
        )
    _log_section("Previous chat loaded")
    logger.info("message_count=%s", len(history))
    logger.info("conversation_id=%s", conversation_id)

    # Step 4: start messages with system prompt + previous chat
    messages = [
        {
            "role": "system",
            "content": (
                SUPPORT_SYSTEM_PROMPT
                + f"\n\nThis conversation is about the order "
                f"{order_id} and the user {user_id}"
            ),
        },
        *history,
    ]

    # Step 5: agent loop — call OpenRouter, run tools, append results, repeat
    for round_number in range(1, 6):
        _log_section("OpenRouter round=%s", round_number)
        payload = {
            "model": model_name,
            "messages": messages,
            "tools": SUPPORT_TOOLS,
        }
        request = urllib.request.Request(
            f"{settings.OPENROUTER_BASE_URL.rstrip('/')}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            _log_section("OpenRouter HTTP error")
            logger.error("status=%s body=%s", exc.code, body)
            raise

        choice = (data.get("choices") or [{}])[0]
        message = choice.get("message") or {}
        tool_calls = message.get("tool_calls") or []
        _log_section("OpenRouter response")
        logger.info("round=%s", round_number)
        logger.info("tool_calls=%s", len(tool_calls))

        # Step 6: if model asked for tools, run them and continue
        if tool_calls:
            messages.append(message)

            for tool_call in tool_calls:
                function = tool_call.get("function") or {}
                tool_name = function.get("name")
                raw_args = function.get("arguments") or "{}"
                try:
                    tool_input = json.loads(raw_args)
                except json.JSONDecodeError:
                    _log_section("Bad tool arguments")
                    logger.warning("tool=%s args=%s", tool_name, raw_args)
                    tool_input = {}

                result = execute_tool(tool_name, tool_input)

                # Append tool result so next turn keeps previous chat + data
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.get("id"),
                        "name": tool_name,
                        "content": json.dumps(
                            {
                                "tool": tool_name,
                                "input": tool_input,
                                "result": result,
                            }
                        ),
                    }
                )
            continue

        # Step 7: no tool call → final text reply for the user
        text = (message.get("content") or "").strip()
        if not text:
            _log_section("Empty model text")
            logger.warning("round=%s", round_number)
            return (
                "Sorry, I could not generate a reply. Please try again."
            )

        _log_section("Support agent done")
        logger.info("conversation_id=%s", conversation_id)
        logger.info("reply_len=%s", len(text))
        return text

    _log_section("Support agent max rounds")
    logger.error("conversation_id=%s", conversation_id)
    return "Sorry, I could not finish that request. Please try again."
