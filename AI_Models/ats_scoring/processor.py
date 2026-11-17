"""
ATS Processor Module
Batch processing of candidate scoring
"""

import asyncio
import os
import logging
from typing import List, Dict, Any, Optional
from ats_scoring.scorer import ATSScorer
from ats_scoring.models import ScoreCandidateResponse

logger = logging.getLogger(__name__)


class ATSProcessor:
    """Process batch scoring requests"""

    # Initialized in startup_event to cap concurrent LLM calls and prevent 429s
    _semaphore: Optional[asyncio.Semaphore] = None
    CONCURRENCY_LIMIT = int(os.getenv("ATS_CONCURRENCY", "10"))

    @staticmethod
    async def _score_with_semaphore(
        sem: asyncio.Semaphore,
        candidate_id: str,
        resume_content: str,
        jd_content: str
    ) -> ScoreCandidateResponse:
        async with sem:
            return await ATSScorer.score_single_candidate(candidate_id, resume_content, jd_content)

    @staticmethod
    async def process_batch(
        jd_content: str,
        candidates: List[Dict[str, str]]
    ) -> List[ScoreCandidateResponse]:
        """
        Process multiple candidates in parallel.

        Args:
            jd_content: Job description text
            candidates: List of {candidateId, resumeContent}

        Returns:
            List of ScoreCandidateResponse objects
        """
        if not candidates:
            logger.warning("Empty candidate list")
            return []

        logger.info(f"Starting batch processing of {len(candidates)} candidates")

        sem = ATSProcessor._semaphore
        tasks = []

        for candidate in candidates:
            candidate_id = candidate.get("candidateId")
            resume_content = candidate.get("resumeContent")

            if not candidate_id or not resume_content:
                logger.warning("Skipping candidate with missing data")
                continue

            tasks.append(
                ATSProcessor._score_with_semaphore(sem, candidate_id, resume_content, jd_content)
            )

        results = await asyncio.gather(*tasks, return_exceptions=True)

        processed_results = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Task failed with exception: {str(result)}")
                processed_results.append(
                    ScoreCandidateResponse(
                        candidateId="unknown",
                        atsScore=0,
                        status="failed",
                        error=str(result)
                    )
                )
            else:
                processed_results.append(result)

        logger.info(f"Batch processing complete: {len(processed_results)} results")
        return processed_results
