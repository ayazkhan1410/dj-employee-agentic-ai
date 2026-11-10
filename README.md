# AI Employee

Django + React app for order management with an AI support agent. Users can sign up, view orders, track deliveries, and (soon) chat with a Gemini-powered support agent.

## Stack

- **Backend:** Django 6, Django REST Framework, SimpleJWT, MySQL
- **Frontend:** React (Vite) on port 3000
- **AI:** Google Gemini (`google-genai`)
- **Run:** Docker Compose (MySQL + backend + frontend) or local venv

## Quick start (Docker)

```bash
cp .env.example .env
# edit .env — set SECRET_KEY, DB_PASSWORD, GEMINI_API_KEY

docker compose up --build
```

| Service   | URL                         |
|-----------|-----------------------------|
| Frontend  | http://localhost:3000       |
| Backend   | http://localhost:9000       |
| Admin     | http://localhost:9000/admin |

Demo logins (seeded on backend start):

| Email               | Password   |
|---------------------|------------|
| `admin@example.com` | `1234`     |
| `alice@example.com` | `alice1234`|
| `bob@example.com`   | `bob1234`  |
| `cara@example.com`  | `cara1234` |

Django admin: username `admin` / password `1234`.

## Local shell / manage.py

Docker MySQL is the source of truth. Compose publishes it on host port **3307**. Keep `.env` as:

```
DB_HOST=127.0.0.1
DB_PORT=3307
```

```bash
source venv/bin/activate
pip install -r requirements.txt
python manage.py shell
```

## Project layout

- `accounts/` — signup, login (JWT), user admin
- `orders/` — orders, products, refunds, dashboard API
- `support/` — chat models + agent tools (`support/tools.py`)
- `frontend/` — React UI

---

## Getting a Free Gemini API Key

This project uses the Google Gemini API. The free tier is enough for development and learning, and no credit card is required.

### 1. Create the key

1. Go to [Google AI Studio](https://aistudio.google.com) and sign in with your Google account.
2. In the left menu, open **Dashboard → API Keys**.
3. Click **Create API key**.
4. Select an existing project or create a new one, then confirm.
5. Copy the key using the copy icon next to it.

> Do **not** click **Set up billing**. Staying on the **Free tier** keeps usage free. Free-tier limits are shown under **Rate Limit** in the left menu.

### 2. Store the key as an environment variable

Never hard-code the key in source files or commit it to Git.

**Windows (CMD):**
```bash
setx GEMINI_API_KEY "your_api_key_here"
```
Close and reopen the terminal afterwards.

**macOS / Linux:**
```bash
echo 'export GEMINI_API_KEY="your_api_key_here"' >> ~/.bashrc
source ~/.bashrc
```

**Or use a `.env` file** in the project root:
```
GEMINI_API_KEY=your_api_key_here
```
Make sure `.env` is listed in `.gitignore`.

### 3. Install the SDK and test

```bash
pip install google-genai
```

From the project root (with venv activated and `GEMINI_API_KEY` in `.env`):

```bash
export GEMINI_API_KEY="$(grep '^GEMINI_API_KEY=' .env | cut -d= -f2-)"
python -c 'from google import genai; client = genai.Client(); r = client.models.generate_content(model="gemini-3.8-flash", contents="Hello"); print(r.text)'
```

Keep `client` in a variable — do **not** chain `genai.Client().models...` in a one-liner, or you can get `RuntimeError: Cannot send a request, as the client has been closed`.

Or in a Python shell / script:

```python
from google import genai

client = genai.Client()  # reads GEMINI_API_KEY from the environment
response = client.models.generate_content(
    model="gemini-3.8-flash",
    contents="Hello",
)
print(response.text)
```

If a reply is printed, the key is working.

**If you get `503 UNAVAILABLE` (high demand)** on `gemini-3.8-flash`, retry later or use a lighter model:

```bash
export GEMINI_API_KEY="$(grep '^GEMINI_API_KEY=' .env | cut -d= -f2-)"
python -c 'from google import genai; client = genai.Client(); r = client.models.generate_content(model="gemini-3.1-flash-lite", contents="Hello"); print(r.text)'
```

That fallback returned: `Hello! How can I help you today?` during setup — so a `503` means Google is busy, not that your key is wrong.

### Notes

- Free-tier requests may be used by Google to improve its models. Do not send private or sensitive data.
- If you hit rate limits or `503` spikes, wait a moment and retry, or reduce request frequency.
- If a key is ever exposed, delete it in **API Keys** and create a new one.
