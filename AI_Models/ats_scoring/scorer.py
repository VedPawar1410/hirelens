"""
ATS Scorer Module
Validates and processes scoring results
"""

import logging
from ats_scoring.models import ScoreCandidateResponse, ScoreBreakdown
from ats_scoring.analyzer import ATSAnalyzer

logger = logging.getLogger(__name__)


class ATSScorer:
    """Process and validate ATS scores"""

    @staticmethod
    async def score_single_candidate(
        candidate_id: str,
        resume_content: str,
        jd_content: str
    ) -> ScoreCandidateResponse:
        """
        Score a single candidate against a job description.

        Returns ScoreCandidateResponse with final score, optional breakdown, or error.
        """
        try:
            logger.info(f"Scoring candidate {candidate_id}...")

            result = await ATSAnalyzer.score_candidate(resume_content, jd_content)

            if result is not None:
                final_score = result["final_score"]
                breakdown_data = result.get("breakdown")

                breakdown = None
                if breakdown_data is not None:
                    breakdown = ScoreBreakdown(
                        skillsScore=breakdown_data["skills_score"],
                        experienceScore=breakdown_data["experience_score"],
                        educationScore=breakdown_data["education_score"],
                        roleFitScore=breakdown_data["role_fit_score"],
                        keyMatches=breakdown_data["key_matches"],
                        keyGaps=breakdown_data["key_gaps"],
                    )

                logger.info(
                    f"Candidate {candidate_id} scored: {final_score}"
                    + (" (with breakdown)" if breakdown else " (fallback mode)")
                )
                return ScoreCandidateResponse(
                    candidateId=candidate_id,
                    atsScore=final_score,
                    status="success",
                    breakdown=breakdown,
                )
            else:
                logger.error(f"Failed to score candidate {candidate_id}")
                return ScoreCandidateResponse(
                    candidateId=candidate_id,
                    atsScore=0,
                    status="failed",
                    error="LLM scoring failed - no valid response"
                )

        except Exception as e:
            logger.error(f"Error scoring candidate {candidate_id}: {str(e)}")
            return ScoreCandidateResponse(
                candidateId=candidate_id,
                atsScore=0,
                status="failed",
                error=f"Scoring error: {str(e)}"
            )

    @staticmethod
    def validate_score(score: int) -> bool:
        """Validate score is in valid range"""
        if isinstance(score, int) and 0 <= score <= 100:
            return True
        logger.warning(f"Invalid score: {score}")
        return False
