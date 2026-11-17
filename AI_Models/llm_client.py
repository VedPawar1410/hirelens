"""
One place for every LLM call in the AI service (JD generation and ATS scoring).

Providers are tried in order - Groq, then Gemini - and a provider without an API key
is skipped. Both expose the OpenAI-compatible chat-completions API, so one request
shape works for both. Model names are configurable because providers retire models
(Groq dropped llama-3.3-70b-versatile, Gemini dropped the 2.5 family).
"""
import asyncio
import logging
import os
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

PROVIDERS = [
    {
        "name": "groq",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "key_env": "GROQ_API_KEY",
        "model_env": "GROQ_MODEL",
        "default_model": "openai/gpt-oss-120b",
    },
    {
        "name": "gemini",
        "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "key_env": "GEMINI_API_KEY",
        "model_env": "GEMINI_MODEL",
        "default_model": "gemini-3.5-flash-lite",
    },
]

TIMEOUT_SECONDS = 60

# Rate limits and "high demand" 5xx are transient on free tiers: retry those once after a
# short pause. A 4xx like a bad key or unknown model never succeeds on retry, so skip ahead.
RETRYABLE_STATUS = {429, 500, 502, 503, 504}
RETRY_DELAY_SECONDS = 2


def configured_providers() -> list[dict]:
    """Providers that have an API key, in fallback order. Read at call time so .env changes apply."""
    result = []
    for p in PROVIDERS:
        key = os.getenv(p["key_env"])
        if key:
            result.append({**p, "key": key, "model": os.getenv(p["model_env"]) or p["default_model"]})
    return result


def _request(provider: dict, messages: list[dict], max_tokens: int, temperature: float, json_mode: bool) -> dict:
    body = {
        "model": provider["model"],
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        # Both default models "think" before answering, and thinking tokens count against
        # max_tokens. Low effort keeps answers fast and stops JSON being cut off mid-string.
        "reasoning_effort": "low",
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    return {"url": provider["url"], "json": body, "headers": {"Authorization": f"Bearer {provider['key']}"}}


def _extract(provider: dict, response: httpx.Response) -> Optional[str]:
    if response.status_code != 200:
        logger.warning(f"{provider['name']} ({provider['model']}) HTTP {response.status_code}: {response.text[:200]}")
        return None
    choice = response.json()["choices"][0]
    text = (choice["message"].get("content") or "").strip()
    if choice.get("finish_reason") == "length":
        logger.warning(f"{provider['name']} hit max_tokens; answer may be truncated")
    return text or None


async def achat(
    messages: list[dict],
    *,
    max_tokens: int,
    temperature: float = 0.1,
    json_mode: bool = False,
    client: Optional[httpx.AsyncClient] = None,
) -> Optional[str]:
    """Async chat completion through the fallback chain. Returns None if every provider fails."""
    providers = configured_providers()
    if not providers:
        logger.error("No LLM provider configured: set GROQ_API_KEY and/or GEMINI_API_KEY")
        return None

    own_client = client is None
    client = client or httpx.AsyncClient(timeout=TIMEOUT_SECONDS)
    try:
        for provider in providers:
            try:
                req = _request(provider, messages, max_tokens, temperature, json_mode)
                response = await client.post(req["url"], json=req["json"], headers=req["headers"])
                if response.status_code in RETRYABLE_STATUS:
                    logger.info(f"{provider['name']} HTTP {response.status_code}; retrying once")
                    await asyncio.sleep(RETRY_DELAY_SECONDS)
                    response = await client.post(req["url"], json=req["json"], headers=req["headers"])
                text = _extract(provider, response)
                if text:
                    logger.info(f"LLM answer from {provider['name']} ({provider['model']})")
                    return text
            except httpx.HTTPError as e:
                logger.warning(f"{provider['name']} request failed: {e}")
        return None
    finally:
        if own_client:
            await client.aclose()


def chat(messages: list[dict], *, max_tokens: int, temperature: float = 0.1, json_mode: bool = False) -> Optional[str]:
    """Blocking version of achat, for the synchronous JD generator."""
    providers = configured_providers()
    if not providers:
        logger.error("No LLM provider configured: set GROQ_API_KEY and/or GEMINI_API_KEY")
        return None

    with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
        for provider in providers:
            try:
                req = _request(provider, messages, max_tokens, temperature, json_mode)
                response = client.post(req["url"], json=req["json"], headers=req["headers"])
                if response.status_code in RETRYABLE_STATUS:
                    logger.info(f"{provider['name']} HTTP {response.status_code}; retrying once")
                    time.sleep(RETRY_DELAY_SECONDS)
                    response = client.post(req["url"], json=req["json"], headers=req["headers"])
                text = _extract(provider, response)
                if text:
                    logger.info(f"LLM answer from {provider['name']} ({provider['model']})")
                    return text
            except httpx.HTTPError as e:
                logger.warning(f"{provider['name']} request failed: {e}")
    return None
