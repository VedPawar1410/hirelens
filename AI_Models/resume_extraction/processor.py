"""
Resume Processing Module

Main orchestrator for resume extraction and parsing.
Handles parallel processing and result organization.
"""

import asyncio
import logging
import tempfile
from typing import List, Dict, Any, Optional
from pathlib import Path
from uuid import uuid4
from concurrent.futures import ThreadPoolExecutor

from resume_extraction.extractor import TextExtractor
from resume_extraction.parser import ResumeParser

logger = logging.getLogger(__name__)


class ResumeProcessor:
    """Process multiple resumes in parallel and return organized results."""

    _executor = ThreadPoolExecutor(max_workers=4)

    @staticmethod
    def _process_single_resume(
        file_data: bytes,
        file_name: str,
        index: int,
        CandidateID: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a single resume file.

        Args:
            file_data: Binary file content
            file_name: Original file name (for extension detection)
            index: Index in the batch (for result ordering)
            CandidateID: Optional candidate ID (if not provided, generates UUID)

        Returns:
            Result dictionary with extracted data or error info
        """
        result_id = CandidateID or str(uuid4())
        temp_path = None

        try:
            # Validate file extension
            file_ext = Path(file_name).suffix.lower()
            if file_ext not in ['.pdf', '.docx']:
                return {
                    "index": index,
                    "CandidateID": result_id,
                    "status": "failed",
                    "error": f"Unsupported file format: {file_ext}. Supported: PDF, DOCX",
                    "name": None,
                    "email": None,
                    "phone": None,
                    "linkedin": None,
                    "github": None,
                    "content": None
                }

            # Write temp file (cross-platform)
            with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False, mode='wb') as temp_file:
                temp_file.write(file_data)
                temp_path = temp_file.name

            # Extract text
            extracted_text = TextExtractor.extract_from_file(temp_path)
            if not extracted_text:
                return {
                    "index": index,
                    "CandidateID": result_id,
                    "status": "failed",
                    "error": "Failed to extract text from file",
                    "name": None,
                    "email": None,
                    "phone": None,
                    "linkedin": None,
                    "github": None,
                    "content": None
                }

            # Parse extracted text
            parsed_data = ResumeParser.parse(extracted_text)

            return {
                "index": index,
                "CandidateID": result_id,
                "status": "success",
                "name": parsed_data.get("name"),
                "email": parsed_data.get("email"),
                "phone": parsed_data.get("phone"),
                "linkedin": parsed_data.get("linkedin"),
                "github": parsed_data.get("github"),
                "content": parsed_data.get("content"),
                "error": None
            }

        except Exception as e:
            logger.error(f"Error processing resume {file_name}: {str(e)}")
            return {
                "index": index,
                "CandidateID": result_id,
                "status": "failed",
                "error": f"Processing error: {str(e)}",
                "name": None,
                "email": None,
                "phone": None,
                "linkedin": None,
                "github": None,
                "content": None
            }

        finally:
            # Always clean up temp file no matter what happened
            if temp_path:
                Path(temp_path).unlink(missing_ok=True)

    @staticmethod
    async def process_batch(
        files: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Process multiple resume files in parallel.

        Args:
            files: List of file dicts:
                {
                    "index": 0,
                    "file_name": "resume.pdf",
                    "file_data": bytes,
                    "CandidateID": "uuid" (optional)
                }

        Returns:
            List of results ordered by index:
            [
                {
                    "index": 0,
                    "CandidateID": "uuid",
                    "status": "success" or "failed",
                    "name": "John Doe" or None,
                    "email": "john@gmail.com" or None,
                    "phone": "+91-9999999999" or None,
                    "linkedin": "linkedin.com/in/johndoe" or None,
                    "github": "github.com/johndoe" or None,
                    "content": "full text...",
                    "error": None or "error message"
                },
                ...
            ]
        """
        if not files:
            logger.warning("Empty file list provided")
            return []

        logger.info(f"Starting batch processing of {len(files)} resumes")

        loop = asyncio.get_event_loop()
        tasks = []

        for file_info in files:
            task = loop.run_in_executor(
                ResumeProcessor._executor,
                ResumeProcessor._process_single_resume,
                file_info["file_data"],
                file_info["file_name"],
                file_info["index"],
                file_info.get("CandidateID")
            )
            tasks.append(task)

        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle any exceptions from gather
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Task exception for file {i}: {str(result)}")
                processed_results.append({
                    "index": files[i]["index"],  # use original index not i
                    "CandidateID": files[i].get("CandidateID") or str(uuid4()),
                    "status": "failed",
                    "error": f"Task execution failed: {str(result)}",
                    "name": None,
                    "email": None,
                    "phone": None,
                    "linkedin": None,
                    "github": None,
                    "content": None
                })
            else:
                processed_results.append(result)

        # Sort by index to maintain original order
        processed_results.sort(key=lambda x: x["index"])

        success_count = sum(1 for r in processed_results if r["status"] == "success")
        failed_count = sum(1 for r in processed_results if r["status"] == "failed")
        logger.info(f"Batch processing complete. Success: {success_count}, Failed: {failed_count}")

        return processed_results