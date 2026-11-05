import os

from decouple import config
from google import genai

os.environ["GEMINI_API_KEY"] = config("GEMINI_API_KEY")

client = genai.Client()
response = client.models.generate_content(
    model=config("GEMINI_MODEL", default="gemini-3.1-flash-lite"),
    contents=config(
        "GEMINI_TEST_PROMPT",
        default="Explain Quantum Computing in one sentence.",
    ),
)
print(response.text)
