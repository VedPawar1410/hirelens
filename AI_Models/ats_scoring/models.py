"""
Data Models for ATS Scoring
Pydantic models for request/response validation
"""

from pydantic import BaseModel
from typing import Optional, List


class ScoreCandidateRequest(BaseModel):
    """Request to score a single candidate"""
    candidateId: str
    resumeContent: str
    jdContent: str

    class Config:
        json_schema_extra = {
            "example": {
                "candidateId": "550e8400-e29b-41d4-a716-446655440000",
                "resumeContent": "John Doe\nSenior Software Engineer\n5 years Python...",
                "jdContent": "Senior Python Developer\nRequirements: Python, Django, REST APIs..."
            }
        }


class ScoreBreakdown(BaseModel):
    """Detailed breakdown of the ATS score by category"""
    skillsScore: int        # LLM-rated technical skills match (0-100)
    experienceScore: int    # LLM-rated experience relevance (0-100)
    educationScore: int     # LLM-rated education requirements match (0-100)
    roleFitScore: int       # LLM-rated contextual/cultural fit (0-100)
    keyMatches: List[str]   # Skills/qualities that match the JD
    keyGaps: List[str]      # Missing requirements identified by the LLM


class ScoreCandidateResponse(BaseModel):
    """Response with candidate score"""
    candidateId: str
    atsScore: int                               # Final LLM composite score (0-100)
    status: str                                 # "success" or "failed"
    error: Optional[str] = None
    breakdown: Optional[ScoreBreakdown] = None  # None when fallback plain-number mode is used

    class Config:
        json_schema_extra = {
            "example": {
                "candidateId": "550e8400-e29b-41d4-a716-446655440000",
                "atsScore": 74,
                "status": "success",
                "error": None,
                "breakdown": {
                    "skillsScore": 85,
                    "experienceScore": 70,
                    "educationScore": 60,
                    "roleFitScore": 72,
                    "keyMatches": ["Python", "Django", "REST APIs"],
                    "keyGaps": ["AWS certification", "team lead experience"]
                }
            }
        }


class CandidateForBatch(BaseModel):
    """Single candidate in batch request"""
    candidateId: str
    resumeContent: str


class BatchScoreRequest(BaseModel):
    """Request to score multiple candidates"""
    jdContent: str
    candidates: List[CandidateForBatch]

    class Config:
        json_schema_extra = {
            "example": {
                "jdContent": "Senior Python Developer\nRequirements: Python, Django...",
                "candidates": [
                    {
                        "candidateId": "uuid-1",
                        "resumeContent": "John Doe\n5 years Python..."
                    },
                    {
                        "candidateId": "uuid-2",
                        "resumeContent": "Jane Smith\n7 years full-stack..."
                    }
                ]
            }
        }
