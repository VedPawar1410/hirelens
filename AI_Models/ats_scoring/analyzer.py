"""
ATS Analyzer Module
Structured LLM analysis with provider fallback chain.
"""

import httpx
import asyncio
import os
import json
import logging
import re
from collections import deque
from dotenv import load_dotenv
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

load_dotenv()


def compute_final_score(overall_score: float) -> int:
    """Clamp and round the LLM overall score into a final integer 0–100."""
    return int(max(0, min(100, round(overall_score))))


# ---------------------------------------------------------------------------
# ATSAnalyzer
# ---------------------------------------------------------------------------

class ATSAnalyzer:
    """Analyze candidate fit using LLM with structured JSON breakdown."""

    # LLM Configuration
    DEFAULT_PROVIDER = os.getenv("DEFAULT_PROVIDER", "groq")

    # NVIDIA Config
    NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
    NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "meta/llama-3.2-11b-vision-instruct")
    NVIDIA_API_URL = os.getenv("NVIDIA_API_URL", "https://integrate.api.nvidia.com/v1/chat/completions")
    NVIDIA_RATE_LIMIT = int(os.getenv("NVIDIA_RATE_LIMIT", "40"))
    NVIDIA_RATE_LIMIT_WINDOW = int(os.getenv("NVIDIA_RATE_LIMIT_WINDOW", "60"))

    # NVIDIA rate-limit state (sliding window)
    _nvidia_request_times: deque = deque()
    _nvidia_lock: Optional[asyncio.Lock] = None  # initialized in startup_event

    # Shared async HTTP client — initialized in startup_event, closed in shutdown_event
    _http_client: Optional[httpx.AsyncClient] = None

    # OpenRouter Config
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")
    OPENROUTER_FALLBACK = os.getenv("OPENROUTER_FALLBACK_MODEL", "openai/gpt-4o-mini")
    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

    # Groq Config
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

    # ------------------------------------------------------------------
    # PRIMARY: Structured JSON prompt
    # Note: {{ and }} produce literal { } in the formatted string so that
    # the JSON schema example is not treated as a format field by str.format().
    # ------------------------------------------------------------------
    ATS_STRUCTURED_PROMPT_TEMPLATE = """You are an ATS (Applicant Tracking System) scoring expert.
Your task is to evaluate how well a candidate matches a job description.

JOB DESCRIPTION:
{jd_content}

CANDIDATE RESUME:
{resume_content}

Return ONLY valid JSON with no markdown fences, no explanation, no extra text.
The JSON must have exactly these keys:

{{
  "overall_score": <integer 0-100>,
  "skills_score": <integer 0-100>,
  "experience_score": <integer 0-100>,
  "education_score": <integer 0-100>,
  "role_fit_score": <integer 0-100>,
  "key_matches": ["skill or quality that matches", ...],
  "key_gaps": ["missing requirement", ...]
}}

Score this candidate's fit for the role on a scale of 0-100, where:
- 0-20: Poor fit - Major skill/experience gaps
- 21-40: Below average fit - Significant gaps
- 41-60: Average fit - Some gaps but qualified
- 61-80: Good fit - Well qualified with minor gaps
- 81-100: Excellent fit - Perfect or near-perfect match

overall_score is your holistic candidate assessment (same scale as above).
The other scores are a detailed breakdown for each dimension.

"""

    # ------------------------------------------------------------------
    # FALLBACK: Plain-number prompt (used when JSON parse fails)
    # ------------------------------------------------------------------
    ATS_PROMPT_TEMPLATE = """You are an ATS (Applicant Tracking System) scoring expert.

Your task is to evaluate how well a candidate matches a job description.

JOB DESCRIPTION:
{jd_content}

CANDIDATE RESUME:
{resume_content}

Score this candidate's fit for the role on a scale of 0-100, where:
- 0-20: Poor fit - Major skill/experience gaps
- 21-40: Below average fit - Significant gaps
- 41-60: Average fit - Some gaps but qualified
- 61-80: Good fit - Well qualified with minor gaps
- 81-100: Excellent fit - Perfect or near-perfect match

Return ONLY a single number between 0 and 100. No other text.
Example: 75
"""

    @staticmethod
    def _parse_score(text: str) -> Optional[int]:
        """Extract first integer 0-100 from LLM fallback response."""
        match = re.search(r'\b([0-9]{1,3})\b', text.strip())
        if match:
            val = int(match.group(1))
            if 0 <= val <= 100:
                return val
        return None

    @staticmethod
    async def _wait_for_nvidia_rate_limit() -> None:
        """Yield to the event loop until a slot is available in the NVIDIA sliding-window rate limit."""
        async with ATSAnalyzer._nvidia_lock:
            loop = asyncio.get_running_loop()
            now = loop.time()
            window = ATSAnalyzer.NVIDIA_RATE_LIMIT_WINDOW
            limit = ATSAnalyzer.NVIDIA_RATE_LIMIT

            while ATSAnalyzer._nvidia_request_times and now - ATSAnalyzer._nvidia_request_times[0] >= window:
                ATSAnalyzer._nvidia_request_times.popleft()

            if len(ATSAnalyzer._nvidia_request_times) >= limit:
                sleep_for = window - (now - ATSAnalyzer._nvidia_request_times[0])
                if sleep_for > 0:
                    logger.info(f"NVIDIA rate limit reached — waiting {sleep_for:.1f}s")
                    await asyncio.sleep(sleep_for)
                now = asyncio.get_running_loop().time()
                while ATSAnalyzer._nvidia_request_times and now - ATSAnalyzer._nvidia_request_times[0] >= window:
                    ATSAnalyzer._nvidia_request_times.popleft()

            ATSAnalyzer._nvidia_request_times.append(asyncio.get_running_loop().time())

    @staticmethod
    def _parse_structured_response(response_text: str) -> Optional[Dict[str, Any]]:
        """
        Parse the LLM's response as a structured JSON dict.

        Handles two common LLM failure modes:
        - JSON wrapped in ```json ... ``` markdown fences (stripped before parse)
        - Numeric fields returned as strings (coerced to int)

        Returns a dict with keys: overall_score, skills_score, experience_score, education_score,
        role_fit_score, key_matches, key_gaps — or None if parsing fails.
        """
        try:
            text = response_text.strip()

            # Strip markdown code fences if present
            if text.startswith("```"):
                lines = text.splitlines()
                text = "\n".join(lines[1:-1]).strip()

            data = json.loads(text)

            required_keys = {"overall_score", "skills_score", "experience_score", "education_score",
                             "role_fit_score", "key_matches", "key_gaps"}
            if not required_keys.issubset(data.keys()):
                logger.warning(f"LLM JSON missing required keys. Got: {list(data.keys())}")
                return None

            def _to_int_score(val) -> int:
                v = int(float(str(val)))
                return max(0, min(100, v))

            return {
                "overall_score":    _to_int_score(data["overall_score"]),
                "skills_score":     _to_int_score(data["skills_score"]),
                "experience_score": _to_int_score(data["experience_score"]),
                "education_score":  _to_int_score(data["education_score"]),
                "role_fit_score":   _to_int_score(data["role_fit_score"]),
                "key_matches":      [str(m) for m in data.get("key_matches", [])],
                "key_gaps":         [str(g) for g in data.get("key_gaps", [])],
            }

        except (json.JSONDecodeError, ValueError, TypeError) as e:
            logger.warning(f"Structured LLM parse failed: {e}. Raw: {response_text[:200]!r}")
            return None

    @staticmethod
    async def _call_nvidia(resume_content: str, jd_content: str, use_structured: bool = True) -> Optional[str]:
        """Call NVIDIA AI Foundation API. Returns raw response text or None on error."""
        try:
            if not ATSAnalyzer.NVIDIA_API_KEY:
                logger.warning("NVIDIA API key not configured")
                return None

            if ATSAnalyzer._http_client is None:
                logger.error("HTTP client not initialized")
                return None

            await ATSAnalyzer._wait_for_nvidia_rate_limit()

            headers = {
                "Authorization": f"Bearer {ATSAnalyzer.NVIDIA_API_KEY}",
                "Content-Type": "application/json"
            }

            template = ATSAnalyzer.ATS_STRUCTURED_PROMPT_TEMPLATE if use_structured else ATSAnalyzer.ATS_PROMPT_TEMPLATE
            prompt = template.format(jd_content=jd_content, resume_content=resume_content)

            payload = {
                "model": ATSAnalyzer.NVIDIA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 400 if use_structured else 10,
            }

            response = await ATSAnalyzer._http_client.post(
                ATSAnalyzer.NVIDIA_API_URL,
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                text = response.json()["choices"][0]["message"]["content"].strip()
                logger.info(f"NVIDIA response (structured={use_structured}): {text[:120]!r}")
                return text
            else:
                logger.error(f"NVIDIA API error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logger.error(f"NVIDIA API call failed: {e}")
            return None

    @staticmethod
    async def _call_groq(resume_content: str, jd_content: str, use_structured: bool = True) -> Optional[str]:
        """Call Groq API. Returns raw response text or None on error."""
        try:
            if not ATSAnalyzer.GROQ_API_KEY:
                logger.warning("Groq API key not configured")
                return None

            if ATSAnalyzer._http_client is None:
                logger.error("HTTP client not initialized")
                return None

            headers = {
                "Authorization": f"Bearer {ATSAnalyzer.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }

            template = ATSAnalyzer.ATS_STRUCTURED_PROMPT_TEMPLATE if use_structured else ATSAnalyzer.ATS_PROMPT_TEMPLATE
            prompt = template.format(jd_content=jd_content, resume_content=resume_content)

            payload = {
                "model": ATSAnalyzer.GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 400 if use_structured else 10,
            }

            response = await ATSAnalyzer._http_client.post(
                ATSAnalyzer.GROQ_URL,
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                text = response.json()["choices"][0]["message"]["content"].strip()
                logger.info(f"Groq response (structured={use_structured}): {text[:120]!r}")
                return text
            else:
                logger.error(f"Groq API error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logger.error(f"Groq API call failed: {e}")
            return None

    @staticmethod
    async def _call_openrouter(resume_content: str, jd_content: str, use_structured: bool = True) -> Optional[str]:
        """Call OpenRouter API. Returns raw response text or None on error."""
        try:
            if not ATSAnalyzer.OPENROUTER_API_KEY:
                logger.warning("OpenRouter API key not configured")
                return None

            if ATSAnalyzer._http_client is None:
                logger.error("HTTP client not initialized")
                return None

            headers = {
                "Authorization": f"Bearer {ATSAnalyzer.OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            }

            template = ATSAnalyzer.ATS_STRUCTURED_PROMPT_TEMPLATE if use_structured else ATSAnalyzer.ATS_PROMPT_TEMPLATE
            prompt = template.format(jd_content=jd_content, resume_content=resume_content)

            payload = {
                "model": ATSAnalyzer.OPENROUTER_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 400 if use_structured else 10,
            }

            response = await ATSAnalyzer._http_client.post(
                ATSAnalyzer.OPENROUTER_URL,
                json=payload,
                headers=headers
            )

            if response.status_code == 200:
                text = response.json()["choices"][0]["message"]["content"].strip()
                logger.info(f"OpenRouter response (structured={use_structured}): {text[:120]!r}")
                return text
            else:
                logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logger.error(f"OpenRouter API call failed: {e}")
            return None

    @staticmethod
    async def _get_raw_llm_response(resume_content: str, jd_content: str, use_structured: bool) -> Optional[str]:
        """Route through the provider fallback chain and return the first successful raw text."""
        provider = ATSAnalyzer.DEFAULT_PROVIDER

        if provider == "nvidia":
            text = await ATSAnalyzer._call_nvidia(resume_content, jd_content, use_structured)
            if text is not None:
                return text
            logger.info("NVIDIA failed, trying Groq fallback...")
            text = await ATSAnalyzer._call_groq(resume_content, jd_content, use_structured)
            if text is not None:
                return text
            logger.info("Groq failed, trying OpenRouter fallback...")
            return await ATSAnalyzer._call_openrouter(resume_content, jd_content, use_structured)

        elif provider == "groq":
            text = await ATSAnalyzer._call_groq(resume_content, jd_content, use_structured)
            if text is not None:
                return text
            logger.info("Groq failed, trying OpenRouter fallback...")
            return await ATSAnalyzer._call_openrouter(resume_content, jd_content, use_structured)

        else:  # openrouter
            text = await ATSAnalyzer._call_openrouter(resume_content, jd_content, use_structured)
            if text is not None:
                return text
            logger.info("OpenRouter failed, trying Groq fallback...")
            return await ATSAnalyzer._call_groq(resume_content, jd_content, use_structured)

    @staticmethod
    async def score_candidate(resume_content: str, jd_content: str) -> Optional[Dict[str, Any]]:
        """
        Score a candidate against a job description using the LLM pipeline.

        Returns a dict with:
          - "final_score" (int, 0-100)
          - "breakdown" (dict or None)
            keys: skills_score, experience_score, education_score,
                  role_fit_score, key_matches, key_gaps

        Returns None only if all LLM providers fail on both structured and fallback prompts.
        breakdown is None when the system uses the plain-number fallback.
        """
        if not resume_content or not jd_content:
            logger.error("Resume or JD content is empty")
            return None

        logger.info(f"ATS scoring started (provider: {ATSAnalyzer.DEFAULT_PROVIDER})")

        # Step 1: Structured LLM prompt
        raw_text = await ATSAnalyzer._get_raw_llm_response(resume_content, jd_content, use_structured=True)

        if raw_text is not None:
            parsed = ATSAnalyzer._parse_structured_response(raw_text)

            if parsed is not None:
                final_score = compute_final_score(parsed["overall_score"])
                logger.info(f"Structured scoring complete: overall_score={parsed['overall_score']}, final={final_score}")
                return {
                    "final_score": final_score,
                    "breakdown": {
                        "skills_score":     parsed["skills_score"],
                        "experience_score": parsed["experience_score"],
                        "education_score":  parsed["education_score"],
                        "role_fit_score":   parsed["role_fit_score"],
                        "key_matches":      parsed["key_matches"],
                        "key_gaps":         parsed["key_gaps"],
                    }
                }

            logger.warning("Structured JSON parse failed — falling back to plain-number prompt.")

        # Step 2: Fallback — plain-number prompt
        fallback_text = await ATSAnalyzer._get_raw_llm_response(resume_content, jd_content, use_structured=False)

        if fallback_text is None:
            logger.error("All LLM providers failed on both structured and fallback prompts.")
            return None

        score = ATSAnalyzer._parse_score(fallback_text)
        if score is None:
            logger.error(f"Could not parse fallback response as integer: {fallback_text[:100]!r}")
            return None
        logger.info(f"Fallback plain-number score: {score}")
        return {"final_score": score, "breakdown": None}
