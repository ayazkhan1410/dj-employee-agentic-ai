import logging

from orders.utils.choices import Event
from support.models import AgentLog

logger = logging.getLogger("support.agent")

_LOG_BORDER = "=" * 73


def clip(text, limit: int = 400) -> str:
    value = str(text).replace("\n", " ").strip()
    if len(value) <= limit:
        return value
    return value[:limit] + "..."


_TOOL_PURPOSE = {
    "get_order_details": "look up the order details",
    "check_delivery_status": "check where the shipment is",
    "get_refund_history": "look up the user's refund history",
}


def _format_args(tool_input) -> str:
    if not isinstance(tool_input, dict) or not tool_input:
        return clip(tool_input, 200)
    return ", ".join(f"{key}={value}" for key, value in tool_input.items())


def _format_result(result) -> str:
    if not isinstance(result, dict) or not result:
        return clip(result)
    preferred = (
        "order_label",
        "product_names",
        "order_status",
        "delivery_status",
        "order_tracking_number",
        "tracking_number",
        "carrier",
        "last_updated",
        "total_amount",
    )
    parts = []
    for key in preferred:
        if key in result and result[key] not in (None, "", []):
            parts.append(f"{key}={result[key]}")
    if not parts:
        return clip(result)
    return clip("; ".join(parts))


class AgentRunLog:
    """Story-style log buffer for one support agent run."""

    def __init__(self, conversation=None) -> None:
        self.conversation = conversation
        self.steps: list[tuple[str, str, str]] = []

    def set_conversation(self, conversation) -> None:
        self.conversation = conversation

    def append(
        self,
        step: str,
        message: str,
        *args,
        event_type: str = Event.SUPPORT,
    ) -> None:
        text = message % args if args else message
        content = f">>> {step}\n{text}"
        self.steps.append((step, text, event_type))
        AgentLog.objects.create(
            conversation=self.conversation,
            event_type=event_type,
            content=content,
        )

    def flush(self) -> None:
        if not self.steps:
            return
        blocks = [_LOG_BORDER, "Agent.py File logs", _LOG_BORDER]
        for step, text, _event_type in self.steps:
            blocks.append(f">>> {step}")
            blocks.append(text)
        blocks.append(_LOG_BORDER)
        logger.info("\n%s", "\n".join(blocks))

    def request_received(
        self,
        user_id,
        order_id,
        conversation_id,
    ) -> None:
        self.append(
            "REQUEST",
            "Got a support request for user %s on order %s "
            "(conversation %s).",
            user_id,
            order_id,
            conversation_id,
        )

    def conversation_missing(self, conversation_id) -> None:
        self.append(
            "ERROR",
            "Could not find conversation %s, so I stopped.",
            conversation_id,
        )

    def api_key_missing(self) -> None:
        self.append("ERROR", "OpenRouter API key is missing, so I stopped.")

    def using_model(self, model_name: str) -> None:
        self.append("MODEL", "Using OpenRouter model '%s'.", model_name)

    def user_message(self, message: str) -> None:
        self.append(
            "USER MESSAGE",
            'User sent this message: "%s"',
            clip(message),
        )

    def chat_context_loaded(self, earlier_count: int) -> None:
        self.append(
            "CONTEXT",
            "Loaded %s earlier message(s) from this chat for context.",
            earlier_count,
        )

    def asking_agent(self, step: int) -> None:
        self.append(
            f"AGENT THINKING (step {step})",
            "Asking the agent what to do next.",
        )

    def openrouter_failed(self, status_code, body) -> None:
        self.append(
            "ERROR",
            "OpenRouter failed with status %s: %s",
            status_code,
            clip(body),
        )

    def no_tool_needed(self, step: int) -> None:
        self.append(
            "NO TOOL CALL",
            "On step %s the agent did NOT call any tool. "
            "It will reply to the user directly.",
            step,
        )

    def decided_tools(self, tool_names: list[str]) -> None:
        labeled = []
        for name in tool_names:
            purpose = _TOOL_PURPOSE.get(name, "run a helper")
            labeled.append(f"{name} (to {purpose})")
        self.append(
            "AGENT PICKS TOOL",
            "The agent decided it needs a tool. Next tool(s): %s.",
            "; ".join(labeled),
            event_type=Event.TOOL_CALL,
        )

    def calling_tool(self, tool_name, tool_input) -> None:
        purpose = _TOOL_PURPOSE.get(tool_name, "run a helper")
        self.append(
            "AGENT CALLS THIS TOOL",
            "Agent is calling this tool: %s (to %s). "
            "Arguments: %s",
            tool_name,
            purpose,
            _format_args(tool_input),
            event_type=Event.TOOL_CALL,
        )

    def tool_returned(self, tool_name, result) -> None:
        self.append(
            "THIS IS THE TOOL RESULT",
            "Tool %s returned this result: %s",
            tool_name,
            _format_result(result),
            event_type=Event.TOOL_RESULT,
        )

    def bad_tool_arguments(self, tool_name, raw_args) -> None:
        self.append(
            "AGENT CALLS THIS TOOL",
            "Agent tried to call tool %s but arguments were bad (%s); "
            "continuing with empty input.",
            tool_name,
            clip(raw_args, 120),
            event_type=Event.TOOL_CALL,
        )

    def feeding_tool_results(self) -> None:
        self.append(
            "SEND TOOL RESULT TO AGENT",
            "Now sending this tool result back to the agent so it can "
            "write the reply.",
            event_type=Event.TOOL_RESULT,
        )

    def empty_agent_text(self, step: int) -> None:
        self.append(
            "ERROR",
            "Agent returned no text on step %s, so I stopped.",
            step,
        )

    def agent_reply(self, text: str) -> None:
        self.append(
            "FINAL REPLY",
            'Agent\'s reply to the user: "%s"',
            clip(text),
            event_type=Event.FINAL,
        )

    def max_steps_reached(self, conversation_id) -> None:
        self.append(
            "ERROR",
            "Hit the max steps without a final reply for conversation %s.",
            conversation_id,
        )
