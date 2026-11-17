"""
Prompt-injection guard for resume text, run before a resume reaches the scoring LLM.

Two independent checks (defence in depth - each catches what the other misses):
1. Deterministic: our own output schema ("overall_score") or chat role markers
   ("Assistant:", "System:") have no reason to appear in a real resume.
2. Meta Prompt Guard 2 (86M classifier on Groq): returns a probability that text is an
   injection/jailbreak. Its window is 512 tokens, so long resumes are checked in chunks.

The eval showed why both are needed: Prompt Guard caught "ignore all previous
instructions" (0.999) but missed a fake pre-written JSON verdict (0.0008).
"""
import asyncio
import logging
import os
import re
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

PROMPT_GUARD_URL = "https://api.groq.com/openai/v1/chat/completions"
PROMPT_GUARD_MODEL = os.getenv("PROMPT_GUARD_MODEL", "meta-llama/llama-prompt-guard-2-86m")
THRESHOLD = 0.5
CHUNK_CHARS = 1500  # ~400 tokens, inside Prompt Guard's 512-token window
CHUNK_OVERLAP = 200  # so an attack split across a boundary is still seen whole

_SCHEMA_OR_ROLE = re.compile(
    r'"?(overall_score|skills_score|role_fit_score|key_matches|key_gaps)"?\s*:'
    r'|^\s*(assistant|system)\s*:',
    re.IGNORECASE | re.MULTILINE,
)


def heuristic_reason(text: str) -> Optional[str]:
    match = _SCHEMA_OR_ROLE.search(text)
    return f"resume contains scoring/role markup: {match.group(0).strip()!r}" if match else None


def _chunks(text: str) -> list[str]:
    step = CHUNK_CHARS - CHUNK_OVERLAP
    return [text[i:i + CHUNK_CHARS] for i in range(0, max(len(text), 1), step)]


async def _prompt_guard(chunk: str, client: httpx.AsyncClient, key: str) -> float:
    r = await client.post(
        PROMPT_GUARD_URL,
        headers={"Authorization": f"Bearer {key}"},
        json={"model": PROMPT_GUARD_MODEL, "messages": [{"role": "user", "content": chunk}]},
    )
    r.raise_for_status()
    return float(r.json()["choices"][0]["message"]["content"])


async def check(text: str, client: Optional[httpx.AsyncClient] = None) -> dict:
    """Returns {"flagged": bool, "reason": str | None, "guard_score": float | None}."""
    reason = heuristic_reason(text)
    if reason:
        return {"flagged": True, "reason": reason, "guard_score": None}

    key = os.getenv("GROQ_API_KEY")
    if not key:
        logger.warning("Prompt Guard skipped: no GROQ_API_KEY (heuristic check only)")
        return {"flagged": False, "reason": None, "guard_score": None}

    own_client = client is None
    client = client or httpx.AsyncClient(timeout=20)
    try:
        scores = await asyncio.gather(*(_prompt_guard(c, client, key) for c in _chunks(text)))
    except (httpx.HTTPError, KeyError, ValueError) as e:
        # Fail open: the hardened prompt still protects scoring if the classifier is down.
        logger.warning(f"Prompt Guard unavailable ({e}); relying on prompt hardening")
        return {"flagged": False, "reason": None, "guard_score": None}
    finally:
        if own_client:
            await client.aclose()

    top = max(scores)
    if top >= THRESHOLD:
        return {"flagged": True, "reason": f"Prompt Guard injection probability {top:.3f}", "guard_score": top}
    return {"flagged": False, "reason": None, "guard_score": top}
