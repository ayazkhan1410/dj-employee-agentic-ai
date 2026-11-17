import json
import urllib.error
import urllib.request
from pathlib import Path

from django.conf import settings

from support.agent_logs import AgentRunLog
from support.models import Conversation, Message
from support.tools import (
    check_delivery_status,
    get_order_details,
    get_refund_history,
)

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


def execute_tool(
    tool_name,
    tool_input,
    run_log: AgentRunLog | None = None,
):
    log = run_log if run_log is not None else AgentRunLog()
    log.calling_tool(tool_name, tool_input)

    if tool_name == "get_order_details":
        result = get_order_details(tool_input["order_id"])
    elif tool_name == "get_refund_history":
        result = get_refund_history(tool_input["user_id"])
    elif tool_name == "check_delivery_status":
        result = check_delivery_status(tool_input["tracking_number"])
    else:
        result = None

    log.tool_returned(tool_name, result)
    if run_log is None:
        log.flush()
    return result


def support_agent_tool(conversation_id, order_id, user_id):
    run_log = AgentRunLog()

    # Step 1: load this conversation from DB
    conversation = Conversation.objects.filter(id=conversation_id).first()
    if conversation is None:
        run_log.conversation_missing(conversation_id)
        run_log.flush()
        return "Sorry, I could not find this conversation."
    run_log.set_conversation(conversation)
    run_log.request_received(user_id, order_id, conversation_id)

    # Step 2: pick OpenRouter model from env (first in the list)
    model_name = (
        settings.LANDING_CHAT_MODELS.split(",")[0].strip()
        or "nvidia/nemotron-3.5-super-vl:free"
    )
    api_key = settings.LANDING_CHAT_SUPPORT_API_KEY
    if not api_key:
        run_log.api_key_missing()
        run_log.flush()
        raise ValueError("LANDING_CHAT_SUPPORT_API_KEY is not set")
    run_log.using_model(model_name)

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

    latest_user_message = ""
    for item in reversed(history):
        if item["role"] == "user":
            latest_user_message = item["content"]
            break
    run_log.user_message(latest_user_message)
    run_log.chat_context_loaded(max(len(history) - 1, 0))

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
        run_log.asking_agent(round_number)
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
            run_log.openrouter_failed(exc.code, body)
            run_log.flush()
            raise

        choice = (data.get("choices") or [{}])[0]
        message = choice.get("message") or {}
        tool_calls = message.get("tool_calls") or []

        # Step 6: if model asked for tools, run them and continue
        if tool_calls:
            tool_names = [
                (call.get("function") or {}).get("name") or "unknown"
                for call in tool_calls
            ]
            run_log.decided_tools(tool_names)
            messages.append(message)

            for tool_call in tool_calls:
                function = tool_call.get("function") or {}
                tool_name = function.get("name")
                raw_args = function.get("arguments") or "{}"
                try:
                    tool_input = json.loads(raw_args)
                except json.JSONDecodeError:
                    run_log.bad_tool_arguments(tool_name, raw_args)
                    tool_input = {}

                result = execute_tool(tool_name, tool_input, run_log)

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
            run_log.feeding_tool_results()
            continue

        # Step 7: no tool call → final text reply for the user
        run_log.no_tool_needed(round_number)
        text = (message.get("content") or "").strip()
        if not text:
            run_log.empty_agent_text(round_number)
            run_log.flush()
            return (
                "Sorry, I could not generate a reply. Please try again."
            )

        run_log.agent_reply(text)
        run_log.flush()
        return text

    run_log.max_steps_reached(conversation_id)
    run_log.flush()
    return "Sorry, I could not finish that request. Please try again."
