import re
from collections import Counter
from datetime import datetime, time, timedelta

from django.db.models import Count
from django.utils import timezone

from orders.utils.choices import Event
from support.models import AgentLog, Conversation

_TOOL_NAME_RE = re.compile(
    r"(?:Agent is calling this tool:\s*|Tool\s+)([A-Za-z0-9_]+)",
    re.IGNORECASE,
)


def _user_agent_logs(user):
    return AgentLog.objects.filter(
        conversation__user=user,
    ).select_related("conversation", "conversation__order")


def _log_to_dict(log: AgentLog) -> dict:
    conversation = log.conversation
    order_id = None
    if conversation is not None:
        order_id = conversation.order_id
    return {
        "id": log.pk,
        "event_type": log.event_type,
        "event_label": log.get_event_type_display(),
        "content": log.content or "",
        "conversation_id": conversation.pk if conversation else None,
        "order_id": order_id,
        "created_at": log.created_at.isoformat(),
    }


def build_agent_logs_dashboard(user, query_params=None) -> dict:
    """Chart-ready agent activity for the authenticated user."""
    query_params = query_params or {}
    logs = _user_agent_logs(user)

    event_filter = (query_params.get("event_type") or "").strip()
    conversation_filter = (query_params.get("conversation_id") or "").strip()
    day_filter = (query_params.get("date") or "").strip()

    filtered = logs
    if event_filter:
        filtered = filtered.filter(event_type=event_filter)
    if conversation_filter.isdigit():
        filtered = filtered.filter(conversation_id=int(conversation_filter))
    if day_filter:
        try:
            day = datetime.strptime(day_filter, "%Y-%m-%d").date()
        except ValueError:
            day = None
        if day is not None:
            start_dt = timezone.make_aware(datetime.combine(day, time.min))
            end_dt = start_dt + timedelta(days=1)
            filtered = filtered.filter(
                created_at__gte=start_dt,
                created_at__lt=end_dt,
            )

    event_rows = {
        row["event_type"]: row["total"]
        for row in logs.values("event_type").annotate(total=Count("id"))
    }
    events_chart = [
        {
            "key": key,
            "label": label,
            "value": event_rows.get(key, 0),
        }
        for key, label in Event.choices
        if event_rows.get(key, 0) > 0 or key in {
            Event.SUPPORT,
            Event.TOOL_CALL,
            Event.TOOL_RESULT,
            Event.FINAL,
        }
    ]

    today = timezone.localdate()
    start = today - timedelta(days=6)
    start_dt = timezone.make_aware(datetime.combine(start, time.min))
    daily_counts = Counter()
    for created_at in logs.filter(created_at__gte=start_dt).values_list(
        "created_at",
        flat=True,
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

    tool_counts = Counter()
    for content in logs.filter(event_type=Event.TOOL_CALL).values_list(
        "content",
        flat=True,
    ):
        if not content:
            continue
        match = _TOOL_NAME_RE.search(content)
        if match:
            tool_counts[match.group(1)] += 1

    tools_chart = [
        {"key": name, "label": name, "value": count}
        for name, count in tool_counts.most_common(8)
    ]

    conversation_qs = (
        Conversation.objects.filter(user=user)
        .annotate(log_count=Count("agent_logs"))
        .filter(log_count__gt=0)
    )
    conversation_count = conversation_qs.count()
    conversation_chart = [
        {
            "key": str(conv.pk),
            "label": conv.title or f"Chat #{conv.pk}",
            "value": conv.log_count,
            "order_id": conv.order_id,
            "conversation_id": conv.pk,
        }
        for conv in conversation_qs.order_by("-updated_at")[:8]
    ]

    recent_logs = [
        _log_to_dict(log)
        for log in filtered.order_by("-created_at")[:40]
    ]

    return {
        "summary": {
            "log_count": logs.count(),
            "support_count": event_rows.get(Event.SUPPORT, 0),
            "tool_call_count": event_rows.get(Event.TOOL_CALL, 0),
            "tool_result_count": event_rows.get(Event.TOOL_RESULT, 0),
            "final_count": event_rows.get(Event.FINAL, 0),
            "conversation_count": conversation_count,
            "filtered_count": filtered.count(),
        },
        "charts": {
            "events": events_chart,
            "volume": volume_chart,
            "tools": tools_chart,
            "conversations": conversation_chart,
        },
        "filters": {
            "event_type": event_filter or None,
            "conversation_id": (
                int(conversation_filter)
                if conversation_filter.isdigit()
                else None
            ),
            "date": day_filter or None,
        },
        "recent_logs": recent_logs,
    }
