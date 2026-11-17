"""
ATS Analyzer Module
Structured LLM scoring of a resume against a job description.
Provider selection and fallback (Groq -> Gemini) live in llm_client.
"""

import json
import logging
import re
from typing import Optional, Dict, Any

import httpx
from dotenv import load_dotenv

import llm_client

logger = logging.getLogger(__name__)

load_dotenv()


# The structured answer is JSON with two lists (key_matches, key_gaps), and the default
# models spend some output tokens "thinking" first. 400 tokens cut answers off mid-list
# (failed JSON -> silent plain-number fallback); 2048 leaves comfortable headroom.
STRUCTURED_MAX_TOKENS = 2048


def compute_final_score(overall_score: float) -> int:
    """Clamp and round the LLM overall score into a final integer 0–100."""
    return int(max(0, min(100, round(overall_score))))


class ATSAnalyzer:
    """Analyze candidate fit using an LLM with a structured JSON breakdown."""

    # Shared async HTTP client — created in api_server startup, closed on shutdown
    _http_client: Optional[httpx.AsyncClient] = None

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
    async def _ask(prompt: str, structured: bool) -> Optional[str]:
        """Send one prompt through the provider chain (Groq -> Gemini)."""
        return await llm_client.achat(
            [{"role": "user", "content": prompt}],
            max_tokens=STRUCTURED_MAX_TOKENS if structured else 256,
            temperature=0.1,
            json_mode=structured,
            client=ATSAnalyzer._http_client,
        )

    @staticmethod
    async def score_candidate(resume_content: str, jd_content: str) -> Optional[Dict[str, Any]]:
        """
        Score a candidate against a job description using the LLM pipeline.

        Returns a dict with:
          - "final_score" (int, 0-100)
          - "breakdown" (dict or None)
            keys: skills_score, experience_score, education_score,
                  role_fit_score, key_matches, key_gaps

        Returns None only if every provider fails on both structured and fallback prompts.
        breakdown is None when the system uses the plain-number fallback.
        """
        if not resume_content or not jd_content:
            logger.error("Resume or JD content is empty")
            return None

        logger.info("ATS scoring started")

        # Step 1: Structured LLM prompt
        prompt = ATSAnalyzer.ATS_STRUCTURED_PROMPT_TEMPLATE.format(jd_content=jd_content, resume_content=resume_content)
        raw_text = await ATSAnalyzer._ask(prompt, structured=True)

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
        prompt = ATSAnalyzer.ATS_PROMPT_TEMPLATE.format(jd_content=jd_content, resume_content=resume_content)
        fallback_text = await ATSAnalyzer._ask(prompt, structured=False)

        if fallback_text is None:
            logger.error("All LLM providers failed on both structured and fallback prompts.")
            return None

        score = ATSAnalyzer._parse_score(fallback_text)
        if score is None:
            logger.error(f"Could not parse fallback response as integer: {fallback_text[:100]!r}")
            return None
        logger.info(f"Fallback plain-number score: {score}")
        return {"final_score": score, "breakdown": None}
