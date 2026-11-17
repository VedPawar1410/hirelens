"""Regression tests for what the ATS scorer actually receives.

Audit finding: the parser sent only text[:1000] as `content`, so the LLM scored
11-33% of each resume. These tests use synthetic resumes only (no real candidates).
"""
import asyncio

import fitz  # PyMuPDF

from ats_scoring.analyzer import ATSAnalyzer, STRUCTURED_MAX_TOKENS
from resume_extraction.parser import MAX_RESUME_CHARS, ResumeParser
from resume_extraction.processor import ResumeProcessor


def _two_page_pdf() -> bytes:
    """A fake resume whose Skills section sits well past character 1000, on page 2."""
    doc = fitz.open()
    page1 = doc.new_page()
    page1.insert_text((50, 60), "Jordan Sample\njordan.sample@example.com\n+1 555 010 0199")
    experience = "\n".join(f"- Built feature {i} for the payments platform" for i in range(40))
    page1.insert_text((50, 120), "Experience\n" + experience, fontsize=9)
    page2 = doc.new_page()
    page2.insert_text((50, 60), "Skills\nKubernetes, Terraform, PostgreSQL\nEducation\nB.Sc. Computer Science")
    return doc.tobytes()


def test_full_resume_reaches_scorer():
    result = ResumeProcessor._process_single_resume(_two_page_pdf(), "resume.pdf", 0)

    assert result["status"] == "success"
    content = result["content"]
    assert len(content) > 1000
    assert "Kubernetes" in content  # page 2, past the old 1000-char cut
    assert "B.Sc. Computer Science" in content


def test_content_is_capped_for_pathological_files():
    parsed = ResumeParser.parse("word " * 10_000)  # 50k chars

    assert len(parsed["content"]) == MAX_RESUME_CHARS


def test_parse_structured_response_handles_fences_and_string_numbers():
    raw = """```json
{"overall_score": "82", "skills_score": 90, "experience_score": 75.6,
 "education_score": 120, "role_fit_score": -5,
 "key_matches": ["Python"], "key_gaps": ["Kubernetes"]}
```"""
    parsed = ATSAnalyzer._parse_structured_response(raw)

    assert parsed["overall_score"] == 82
    assert parsed["experience_score"] == 75
    assert parsed["education_score"] == 100  # clamped
    assert parsed["role_fit_score"] == 0  # clamped
    assert parsed["key_gaps"] == ["Kubernetes"]


def test_parse_structured_response_rejects_truncated_or_incomplete_json():
    truncated = '{"overall_score": 70, "skills_score": 80, "key_matches": ["Py'
    missing_keys = '{"overall_score": 70}'

    assert ATSAnalyzer._parse_structured_response(truncated) is None
    assert ATSAnalyzer._parse_structured_response(missing_keys) is None


class _FakeResponse:
    status_code = 200

    def json(self):
        return {"choices": [{"message": {"content": "{}"}}]}


class _RecordingClient:
    def __init__(self):
        self.payloads = []

    async def post(self, url, json, headers):
        self.payloads.append(json)
        return _FakeResponse()


def test_structured_request_leaves_room_for_the_json_answer(monkeypatch):
    client = _RecordingClient()
    monkeypatch.setattr(ATSAnalyzer, "_http_client", client)
    monkeypatch.setattr(ATSAnalyzer, "GROQ_API_KEY", "test-key")

    asyncio.run(ATSAnalyzer._call_groq("resume", "jd", use_structured=True))

    assert client.payloads[0]["max_tokens"] == STRUCTURED_MAX_TOKENS >= 1024
