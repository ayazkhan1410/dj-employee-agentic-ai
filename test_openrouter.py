import json
import urllib.error
import urllib.request

from decouple import config

api_key = config("LANDING_CHAT_SUPPORT_API_KEY")
base_url = config(
    "OPENROUTER_BASE_URL",
    default="https://openrouter.ai/api/v1",
).rstrip("/")
model = config(
    "LANDING_CHAT_MODELS",
    default="nvidia/nemotron-3.5-super-vl:free",
).split(",")[0].strip()
prompt = config(
    "OPENROUTER_TEST_PROMPT",
    default="Explain Quantum Computing in one sentence.",
)

payload = {
    "model": model,
    "messages": [{"role": "user", "content": prompt}],
}
request = urllib.request.Request(
    f"{base_url}/chat/completions",
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
    raise SystemExit(f"OpenRouter HTTP {exc.code}: {body}") from exc

choice = (data.get("choices") or [{}])[0]
message = choice.get("message") or {}
print(message.get("content") or data)
