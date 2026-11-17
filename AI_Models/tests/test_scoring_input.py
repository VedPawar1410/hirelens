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
    def __init__(self, status=200, content="{}"):
        self.status_code = status
        self._content = content
        self.text = content

    def json(self):
        return {"choices": [{"message": {"content": self._content}, "finish_reason": "stop"}]}


class _RecordingClient:
    """Hard-fails the first provider (401, not retryable), answers from the second."""

    def __init__(self):
        self.calls = []

    async def post(self, url, json, headers):
        self.calls.append((url, json))
        return _FakeResponse(401, "bad key") if len(self.calls) == 1 else _FakeResponse(200, '{"ok": 1}')


def test_llm_client_falls_back_from_groq_to_gemini(monkeypatch):
    import llm_client
    monkeypatch.setenv("GROQ_API_KEY", "g-test")
    monkeypatch.setenv("GEMINI_API_KEY", "m-test")
    client = _RecordingClient()

    text = asyncio.run(llm_client.achat([{"role": "user", "content": "hi"}],
                                        max_tokens=STRUCTURED_MAX_TOKENS, json_mode=True, client=client))

    assert text == '{"ok": 1}'
    assert "groq.com" in client.calls[0][0] and "googleapis.com" in client.calls[1][0]
    body = client.calls[0][1]
    assert body["max_tokens"] == STRUCTURED_MAX_TOKENS >= 2048
    assert body["response_format"] == {"type": "json_object"}
    assert body["reasoning_effort"] == "low"


def test_llm_client_skips_providers_without_keys(monkeypatch):
    import llm_client
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "m-test")

    assert [p["name"] for p in llm_client.configured_providers()] == ["gemini"]


class _FlakyClient:
    """First call: 503 (transient). Second call: success."""

    def __init__(self):
        self.urls = []

    async def post(self, url, json, headers):
        self.urls.append(url)
        return _FakeResponse(503, "busy") if len(self.urls) == 1 else _FakeResponse(200, "ok")


def test_llm_client_retries_transient_errors_on_the_same_provider(monkeypatch):
    import llm_client
    monkeypatch.setenv("GROQ_API_KEY", "g-test")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setattr(llm_client, "RETRY_DELAY_SECONDS", 0)
    client = _FlakyClient()

    text = asyncio.run(llm_client.achat([{"role": "user", "content": "hi"}], max_tokens=64, client=client))

    assert text == "ok"
    assert len(client.urls) == 2 and all("groq.com" in u for u in client.urls)


def test_name_is_extracted_from_a_name_dash_headline_first_line():
    from resume_extraction.parser import ContactInfoParser
    for text, expected in [
        ("Morgan Vale - Graphic Designer, 4 years.\nBrand identities in Illustrator.", "Morgan Vale"),
        ("Dana Okafor | Frontend Engineer\ndana@example.com", "Dana Okafor"),
        ("Avery Stone, Backend Engineer, 5 years\nPython, FastAPI", "Avery Stone"),
    ]:
        name, _method = ContactInfoParser.extract_name(text)
        assert name == expected, (text, name)


def test_name_split_does_not_turn_a_job_title_into_a_name():
    from resume_extraction.parser import ContactInfoParser
    name, _ = ContactInfoParser.extract_name("Senior Backend Engineer - 5 years\nPython, FastAPI, PostgreSQL")
    assert name is None
