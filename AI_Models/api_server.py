#FastAPI Server for JD Generation.Exposes REST API endpoint for .NET backend to call

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from jd_creation.jd_generator import JDGenerator
from resume_extraction.processor import ResumeProcessor
from ats_scoring.processor import ATSProcessor
from ats_scoring.models import ScoreCandidateRequest, BatchScoreRequest, ScoreCandidateResponse
from ats_scoring.scorer import ATSScorer
from ats_scoring.analyzer import ATSAnalyzer
from Email_sender.email_service import EmailService
from Email_sender.models import SendInterviewEmailRequest, SendInterviewEmailResponse
import hmac
import httpx
import os
from dotenv import load_dotenv
import logging
from io import BytesIO
import asyncio
from urllib.parse import quote

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(
    title="JD Generator API",
    version="1.0.0",
    description="REST API for generating Job Descriptions using LLM"
)

# Only the .NET API may call this service. On free hosting it has a public URL, so without
# a shared secret anyone could spend the LLM keys or send email through it.
# INTERNAL_API_KEY unset = local development, check skipped.
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
PUBLIC_PATHS = {"/health"}


@app.middleware("http")
async def require_internal_key(request, call_next):
    if INTERNAL_API_KEY and request.url.path not in PUBLIC_PATHS:
        supplied = request.headers.get("X-Internal-Key", "")
        if not hmac.compare_digest(supplied.encode(), INTERNAL_API_KEY.encode()):
            return JSONResponse(status_code=401, content={"detail": "Missing or invalid internal key"})
    return await call_next(request)


# Allow .NET backend and Frontend to call this API (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",      # .NET Backend (HTTP)
        "http://localhost:5171",      # .NET Backend (HTTPS)
        "https://localhost:5001",     # .NET Backend (HTTPS)
        "http://localhost:5173",      # Frontend (Vite dev server)
        "http://127.0.0.1:5000",
        "http://127.0.0.1:5001",
        "https://127.0.0.1:5001",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# REQUEST/RESPONSE MODELS (Data validation)
# ============================================================================

class JDRequest(BaseModel):
    """
    Expected input from .NET backend
    All fields match Frontend/Backend field names (camelCase)
    """
    experienceLevel: Optional[str] = None
    jobTitle: str
    location: Optional[str] = None
    workMode: Optional[str] = None
    workHours: Optional[str] = None
    duration: Optional[str] = None
    stipend: Optional[str] = None
    salary: Optional[str] = None
    fullTimeOfferSalary: Optional[str] = None
    experienceYears: Optional[str] = None
    relevantExperience: Optional[str] = None
    noticePeriod: Optional[str] = None
    roleDescription: str
    companyName: Optional[str] = "Acme Corp"
    
    class Config:
        json_schema_extra = {
            "example": {
                "jobTitle": "Senior AI Engineer",
                "experienceLevel": "experienced",
                "location": "Hyderabad",
                "workMode": "Remote",
                "workHours": "2:00 PM - 8:00 PM",
                "duration": "Permanent",
                "salary": "500000",
                "experienceYears": "5",
                "roleDescription": "Lead AI/ML development initiatives...",
                "companyName": "Acme Corp"
            }
        }


class JDResponse(BaseModel):
    """Response from API to .NET backend"""
    status: str  # "success" or "error"
    jd: Optional[str] = None
    error: Optional[str] = None
    message: Optional[str] = None


class PDFDownloadRequest(BaseModel):
    """
    Request to download JD as PDF (with optionally edited content)
    Format received from Frontend after editing
    """
    finalJD: str  # The edited JD content
    job_title: str   # Job title for filename
    experience_level: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    work_hours: Optional[str] = None
    duration: Optional[str] = None
    stipend_salary: Optional[str] = None  # for intern
    fulltime_offer_salary: Optional[str] = None #for inter/fresher/experienced based on the experience_level field it will be automatically taken.
    years_of_experience: Optional[str] = None
    relevant_experience: Optional[str] = None
    notice_period: Optional[str] = None
    role_description: Optional[str] = None
    assigned_to: Optional[list] = None  # Not used for PDF generation, just for reference
    
    class Config:
        json_schema_extra = {
            "example": {
                "finalJD": "## Senior AI Engineer\n\n### About Us\n...",
                "job_title": "Senior AI Engineer",
                "location": "Hyderabad",
                "work_mode": "Remote",
                "experience_level": "experienced",
                "years_of_experience": "5"
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str


# ============================================================================
# RESUME EXTRACTION MODELS
# ============================================================================

class ExtractedCandidate(BaseModel):
    """Extracted candidate information from a resume"""
    index: int
    CandidateID: str
    status: str  # "success" or "failed"
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    content: Optional[str] = None
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "index": 0,
                "CandidateID": "550e8400-e29b-41d4-a716-446655440000",
                "status": "success",
                "name": "John Doe",
                "email": "john@gmail.com",
                "phone": "+91-9876543210",
                "linkedin": "https://linkedin.com/in/johndoe",
                "github": "https://github.com/johndoe",
                "content": "John Doe\nEmail: john@gmail.com\nPhone: +91-9876543210\n...",
                "error": None
            }
        }


class ResumeBatchResponse(BaseModel):
    """Response containing extracted data from multiple resumes"""
    total: int
    successful: int
    failed: int
    results: List[ExtractedCandidate]
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 3,
                "successful": 2,
                "failed": 1,
                "results": [
                    {
                        "index": 0,
                        "CandidateID": "uuid-1",
                        "status": "success",
                        "name": "John Doe",
                        "email": "john@gmail.com",
                        "phone": "+91-9876543210",
                        "linkedin": "https://linkedin.com/in/johndoe",
                        "github": "https://github.com/johndoe",
                        "content": "...",
                        "error": None
                    },
                    {
                        "index": 2,
                        "CandidateID": "uuid-3",
                        "status": "failed",
                        "error": "Unsupported file format: .txt",
                        "name": None,
                        "email": None,
                        "phone": None,
                        "linkedin": None,
                        "github": None,
                        "content": None
                    }
                ]
            }
        }


# ============================================================================
# ROUTES (API Endpoints)
# ============================================================================

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint
    Use this to verify the API is running
    """
    return HealthResponse(
        status="healthy",
        service="JD Generator API",
        version="1.0.0"
    )


@app.post("/generate-jd", response_model=JDResponse, tags=["JD Generation"])
async def generate_jd(request: JDRequest):
    """
    Generate a Job Description from HR form data
    
    This is the main endpoint called by .NET Backend
    
    Input:
    - experienceLevel: "intern", "fresher", or "experienced"
    - jobTitle: Required. E.g., "AI Engineer"
    - location: E.g., "Hyderabad"
    - workMode: "On-site", "Remote", or "Hybrid"
    - workHours: E.g., "2:00 PM - 8:00 PM"
    - duration: E.g., "6 Months", "Permanent"
    - stipend: For interns (in INR)
    - salary: For experienced (in INR)
    - fullTimeOfferSalary: For freshers (in INR)
    - experienceYears: Required years of experience (number)
    - roleDescription: Required. Detailed role description
    - companyName: Optional, defaults to "Acme Corp"
    
    Output:
    {
        "status": "success",
        "jd": "## Job Title\nAI Engineer\n...",
        "message": "JD generated successfully"
    }
    
    Or on error:
    {
        "status": "error",
        "error": "Error message here",
        "jd": null
    }
    """
    try:
        logger.info(f"Received request to generate JD for: {request.jobTitle}")
        
        # Convert camelCase (from Frontend/Backend) to snake_case (for jd_generator.py)
        # Intelligently map compensation based on role type
        experience_level = request.experienceLevel.lower() if request.experienceLevel else None
        
        # For interns: use stipend + fullTimeOfferSalary
        # For freshers/experienced: use salary
        if experience_level == 'intern':
            compensation = int(request.stipend) if request.stipend else (int(request.salary) if request.salary else None)
            fulltime_comp = int(request.fullTimeOfferSalary) if request.fullTimeOfferSalary else None
        else:
            # For fresher/experienced: salary takes priority, fallback to stipend
            compensation = int(request.salary) if request.salary else (int(request.stipend) if request.stipend else None)
            fulltime_comp = None
        
        hr_input = {
            "job_title": request.jobTitle,
            "experience_level": request.experienceLevel,
            "location": request.location,
            "work_mode": request.workMode,
            "work_hours": request.workHours,
            "duration": request.duration,
            "stipend_salary": compensation,  # Now properly mapped based on role
            "fulltime_offer_salary": fulltime_comp,  # Only for interns
            "years_of_experience": request.experienceYears if request.experienceYears else None,
            "relevant_experience": request.relevantExperience if request.relevantExperience else None,
            "notice_period": request.noticePeriod if request.noticePeriod else None,
            "role_info": request.roleDescription,
            "company_name": request.companyName or "Acme Corp",
            "about_us": "At Acme Corp, we are more than just a team – we are a product development community driven by a shared vision. Our values shape who we are, what we do, and how we interact with our peers and our customers. We're not just seeking any regular engineer; we want individuals who identify with our core values and are passionate about software development."
        }
        
        logger.info(f"Initializing JD Generator...")
        
        # Create generator instance and generate JD
        generator = JDGenerator()
        jd = generator.generate_jd(hr_input)
        
        if not jd or jd.strip() == "":
            logger.error("JD generator returned empty content")
            raise ValueError("JD generator returned empty content")
        
        logger.info(f"JD generated successfully ({len(jd)} characters)")
        
        return JDResponse(
            status="success",
            jd=jd,
            message="JD generated successfully"
        )
    
    except ValueError as ve:
        logger.error(f"Validation Error: {str(ve)}")
        return JDResponse(
            status="error",
            error=str(ve),
            jd=None
        )
    
    except Exception as e:
        logger.error(f"❌ Unexpected Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return JDResponse(
            status="error",
            error=f"Failed to generate JD: {str(e)}",
            jd=None
        )


@app.post("/generate-jd-and-pdf", tags=["JD Generation"])
async def generate_jd_and_pdf(request: JDRequest):
    """
    Generate JD and convert to PDF
    Optional endpoint for future use
    """
    try:
        logger.info(f"📝 Request: Generate JD + PDF for: {request.jobTitle}")
        
        # Convert camelCase to snake_case
        hr_input = {
            "job_title": request.jobTitle,
            "experience_level": request.experienceLevel,
            "location": request.location,
            "work_mode": request.workMode,
            "work_hours": request.workHours,
            "duration": request.duration,
            "stipend_salary": int(request.stipend) if request.stipend else None,
            "salary": int(request.salary) if request.salary else None,
            "fulltime_offer_salary": int(request.fullTimeOfferSalary) if request.fullTimeOfferSalary else None,
            "years_of_experience": request.experienceYears if request.experienceYears else None,
            "role_info": request.roleDescription,
            "company_name": request.companyName or "Acme Corp",
            "about_us": "At Acme Corp, we are more than just a team – we are a product development community driven by a shared vision. Our values shape who we are, what we do, and how we interact with our peers and our customers. We're not just seeking any regular engineer; we want individuals who identify with our core values and are passionate about software development."
        }
        
        # Generate JD
        generator = JDGenerator()
        jd = generator.generate_jd(hr_input)
        
        if not jd:
            raise ValueError("JD generator returned empty content")
        
        # Generate PDF
        output_filename = f"jd_{request.jobTitle.replace(' ', '_')}.pdf"
        pdf_success = generator.generate_pdf(jd, hr_input, output_filename)
        
        if not pdf_success:
            raise ValueError("Failed to generate PDF")
        
        logger.info(f"✅ JD + PDF generated: {output_filename}")
        
        return JDResponse(
            status="success",
            jd=jd,
            message=f"JD and PDF generated successfully: {output_filename}"
        )
    
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        return JDResponse(
            status="error",
            error=str(e),
            jd=None
        )


@app.post("/download-pdf", tags=["JD Generation"])
async def download_pdf(request: PDFDownloadRequest):
    """
    Download JD as PDF file (with edited content)
    
    Input:
    - finalJD: The edited JD content (required)
    - job_title: Required. Job title for the filename
    - experience_level, location, work_mode, etc: Optional, for PDF styling
    - assigned_to: Ignored (for backend reference only)
    
    Output:
    Binary PDF file with proper headers for browser download
    """
    try:
        logger.info(f"📥 PDF Download Request for: {request.job_title}")
        
        # Validate JD content
        if not request.finalJD or request.finalJD.strip() == "":
            logger.error("❌ JD content is empty")
            raise ValueError("JD content cannot be empty")
        
        # .NET backend already routed salary into the correct field before storing.
        # stipend_salary holds the compensation for all role types; fulltime_offer_salary is intern-only.
        compensation = int(request.stipend_salary) if request.stipend_salary else None
        fulltime_comp = int(request.fulltime_offer_salary) if request.fulltime_offer_salary else None
        
        # Create HR input dictionary for PDF styling
        hr_input = {
            "job_title": request.job_title,
            "experience_level": request.experience_level or "Not specified",
            "location": request.location or "Not specified",
            "work_mode": request.work_mode or "Not specified",
            "work_hours": request.work_hours or "Not specified",
            "duration": request.duration or "Not specified",
            "stipend_salary": compensation,  # Now properly mapped based on role
            "fulltime_offer_salary": fulltime_comp,  # Only for interns
            "years_of_experience": request.years_of_experience or None,  # Keep as string (can be range like "7-10")
            "relevant_experience": request.relevant_experience or None,
            "notice_period": request.notice_period or None,
            "company_name": "Acme Corp",
            "about_us": "At Acme Corp, we are more than just a team – we are a product development community driven by a shared vision. Our values shape who we are, what we do, and how we interact with our peers and our customers. We're not just seeking any regular engineer; we want individuals who identify with our core values and are passionate about software development."
        }
        
        # Generate PDF as bytes
        logger.info(f"🔄 Generating PDF...")
        generator = JDGenerator()
        pdf_bytes = generator.generate_pdf_bytes(request.finalJD, hr_input)
        
        if not pdf_bytes:
            logger.error("❌ Failed to generate PDF")
            raise ValueError("Failed to generate PDF content")
        
        # Create filename (sanitize job title and encode for HTTP header)
        # First sanitize for filesystem compatibility
        safe_filename = request.job_title.replace('/', '_').replace('\\', '_')
        # Create ASCII-safe fallback filename for older clients
        fallback_filename = "".join([c if c.isalnum() or c in "._- " else "_" for c in safe_filename])
        filename = f"JD_{safe_filename}.pdf"
        fallback_filename = f"JD_{fallback_filename}.pdf"
        
        logger.info(f"✅ PDF generated ({len(pdf_bytes)} bytes): {filename}")
        
        # Use RFC 5987 encoding for Content-Disposition header to support Unicode characters
        encoded_filename = quote(filename, safe='')
        content_disposition = f'attachment; filename="{fallback_filename}"; filename*=UTF-8\'\'{encoded_filename}'
        
        # Return PDF as binary stream for download
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": content_disposition}
        )
    
    except ValueError as ve:
        logger.error(f"❌ Validation Error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    
    except Exception as e:
        logger.error(f"❌ Unexpected Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
    
    
@app.post("/edit-and-download-pdf", tags=["JD Generation"])
async def edit_and_download_pdf(request: PDFDownloadRequest):
    """
    Alternative endpoint: Edit JD content and download as PDF in one request
    Same functionality as /download-pdf but with a more descriptive name
    """
    return await download_pdf(request)


# ============================================================================
# RESUME EXTRACTION ENDPOINTS
# ============================================================================

@app.post("/extract-resumes", response_model=List[ExtractedCandidate], tags=["Resume Extraction"])
async def extract_resumes(files: List[UploadFile] = File(...)):
    """
    Extract candidate information from multiple resume files (batch processing).
    
    Accepts multiple PDF and DOCX files and processes them in parallel.
    Returns extracted data (name, email, phone, linkedin, github) ordered by upload index.
    
    Supported Formats:
    - PDF (.pdf) - text-based PDFs
    - DOCX (.docx) - Microsoft Word documents
    
    Input:
    - files: List of resume files (multipart/form-data)
    
    Output:
    {
        "total": 3,
        "successful": 2,
        "failed": 1,
        "results":[
            {
                "index": 0,
                "CandidateID": "uuid",
                "status": "success",
                "name": "John Doe",
                "email": "john@gmail.com",
                "phone": "+91-9876543210",
                "linkedin": "https://linkedin.com/in/johndoe",
                "github": "https://github.com/johndoe",
                "content": "...",
                "error": null
            },
            ...
        ]
    }
    """
    try:
        if not files:
            logger.warning("No files provided for extraction")
            return ResumeBatchResponse(total=0, successful=0, failed=0, results=[])
        
        logger.info(f"📥 Batch resume extraction started: {len(files)} files")
        
        # Prepare file data for processing
        file_data_list = []
        for index, upload_file in enumerate(files):
            try:
                content = await upload_file.read()
                file_data_list.append({
                    "index": index,
                    "file_name": upload_file.filename,
                    "file_data": content,
                    "CandidateID": None  # Generate UUID in processor
                })
            except Exception as e:
                logger.error(f"Failed to read file {upload_file.filename}: {str(e)}")
                file_data_list.append({
                    "index": index,
                    "file_name": upload_file.filename,
                    "file_data": None,
                    "CandidateID": None
                })
        
        # Process all files in parallel
        results = await ResumeProcessor.process_batch(file_data_list)
        
        # Calculate statistics
        successful = sum(1 for r in results if r["status"] == "success")
        failed = sum(1 for r in results if r["status"] == "failed")
        
        logger.info(f"✅ Batch processing complete: {successful} successful, {failed} failed")
        
        # Convert results to ExtractedCandidate objects
        candidates = [ExtractedCandidate(**result) for result in results]
        
        return candidates
    
    except Exception as e:
        logger.error(f"❌ Batch extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process batch: {str(e)}")


@app.post("/extract-resume", response_model=ExtractedCandidate, tags=["Resume Extraction"])
async def extract_single_resume(file: UploadFile = File(...)):
    """
    Extract candidate information from a single resume file (testing endpoint).
    
    Supported Formats:
    - PDF (.pdf) - text-based PDFs
    - DOCX (.docx) - Microsoft Word documents
    
    Input:
    - file: Single resume file (multipart/form-data)
    
    Output:
    {
        "index": 0,
        "CandidateID": "uuid",
        "status": "success",
        "name": "John Doe",
        "email": "john@gmail.com",
        "phone": "+91-9876543210",
        "linkedin": "https://linkedin.com/in/johndoe",
        "github": "https://github.com/johndoe",
        "content": "...",
        "error": null
    }
    """
    try:
        if not file:
            logger.error("No file provided")
            raise HTTPException(status_code=400, detail="No file provided")
        
        logger.info(f"📄 Processing single resume: {file.filename}")
        
        # Read file content
        content = await file.read()
        
        # Process single file (using batch processor with 1 file)
        results = await ResumeProcessor.process_batch([{
            "index": 0,
            "file_name": file.filename,
            "file_data": content,
            "CandidateID": None
        }])
        
        if not results:
            raise HTTPException(status_code=500, detail="Failed to process resume")
        
        result = results[0]
        logger.info(f"✅ Resume processed: {result.get('name', 'Unknown')}")
        
        return ExtractedCandidate(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Single resume extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")


# ============================================================================
# ATS SCORING ENDPOINTS
# ============================================================================

@app.post("/score-candidate", response_model=ScoreCandidateResponse, tags=["ATS Scoring"])
async def score_candidate(request: ScoreCandidateRequest):
    """
    Score a single candidate against a job description using LLM analysis.
    
    Input:
    - candidateId: Unique candidate identifier (UUID)
    - resumeContent: Raw text from extracted resume
    - jdContent: Raw text of job description
    
    Output:
    {
        "candidateId": "550e8400-e29b-41d4-a716-446655440000",
        "atsScore": 78,
        "status": "success"
    }
    
    The score (0-100) indicates how well the candidate matches the job:
    - 0-20: Poor fit
    - 21-40: Below average fit
    - 41-60: Average fit
    - 61-80: Good fit
    - 81-100: Excellent fit
    """
    try:
        logger.info(f"🎯 Scoring candidate {request.candidateId}...")
        
        response = await ATSScorer.score_single_candidate(
            request.candidateId,
            request.resumeContent,
            request.jdContent
        )
        
        logger.info(f"✅ Candidate {request.candidateId} scored: {response.atsScore}")
        return response
    
    except Exception as e:
        logger.error(f"❌ Error scoring candidate: {str(e)}")
        return ScoreCandidateResponse(
            candidateId=request.candidateId,
            atsScore=0,
            status="failed",
            error=str(e)
        )


@app.post("/score-candidates", tags=["ATS Scoring"])
async def score_candidates(request: BatchScoreRequest):
    """
    Score multiple candidates against a single job description using LLM analysis.
    
    Input:
    {
        "jdContent": "Senior Python Developer\nRequirements: Python, Django...",
        "candidates": [
            { "candidateId": "uuid-1", "resumeContent": "John Doe\n5 years..." },
            { "candidateId": "uuid-2", "resumeContent": "Jane Smith\n7 years..." }
        ]
    }
    
    Output:
    [
        { "candidateId": "uuid-1", "atsScore": 78, "status": "success" },
        { "candidateId": "uuid-2", "atsScore": 85, "status": "success" }
    ]
    
    Processes candidates in parallel for better performance.
    """
    try:
        logger.info(f"🎯 Batch scoring {len(request.candidates)} candidates...")
        
        # Convert to dict format for processor
        candidates_list = [
            {
                "candidateId": c.candidateId,
                "resumeContent": c.resumeContent
            }
            for c in request.candidates
        ]
        
        # Process batch
        results = await ATSProcessor.process_batch(
            request.jdContent,
            candidates_list
        )
        
        logger.info(f"✅ Batch scoring complete: {len(results)} candidates")
        
        # Return as list of response objects
        return results
    
    except Exception as e:
        logger.error(f"❌ Batch scoring error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch scoring failed: {str(e)}")


# ============================================================================
# EMAIL SENDER ENDPOINTS
# ============================================================================

@app.post("/send-interview-email", response_model=SendInterviewEmailResponse, tags=["Email Sender"])
async def send_interview_email(request: SendInterviewEmailRequest):
    """
    Send interview notification emails to candidate and interviewer
    
    This endpoint sends two emails:
    1. To Candidate: Personalized email based on interview round (L1/L2/L3/L4)
    2. To Interviewer: Summary email with interview details
    
    Both emails include:
    - Candidate's resume (PDF)
    - Job Description (PDF)
    
    Input:
    {
        "interviewId": "uuid",
        "candidateName": "John Doe",
        "candidateEmail": "john@example.com",
        "interviewerName": "Jane Smith",
        "interviewerEmail": "jane@example.com",
        "jobTitle": "Senior AI Engineer",
        "interviewRound": "L1",  // or L2, L3, L4
        "interviewType": "Technical",
        "interviewMode": "online",
        "startTime": "2026-05-25T10:00:00+05:30",
        "endTime": "2026-05-25T11:00:00+05:30",
        "durationMinutes": 60,
        "timezone": "Asia/Kolkata",
        "meetingLink": "https://teams.microsoft.com/...",
        "location": null,
        "createdByUserName": "HR Admin",
        "createdByUserEmail": "hr@example.com",
        "resumeBase64": "JVBERi0xLjQKJ...",  // Base64 encoded PDF
        "jdBase64": "JVBERi0xLjQKJ...",      // Base64 encoded PDF
        "additionalInstructions": "Please prepare coding questions"
    }
    
    Output:
    {
        "success": true,
        "message": "Emails sent successfully.",
        "data": {
            "candidateEmailStatus": "sent",
            "interviewerEmailStatus": "sent"
        },
        "error": null
    }
    
    Error Handling:
    - If any email fails, that field will be "failed" in the response
    - success=true only if both emails sent
    - error field contains details if any email failed
    
    SMTP Configuration Required:
    - SMTP_SERVER (e.g., smtp.gmail.com)
    - SMTP_PORT (e.g., 587 for TLS)
    - SENDER_EMAIL (your email)
    - SENDER_PASSWORD (app password, not regular password)
    
    Add these to .env file
    """
    try:
        logger.info(f"📧 Processing email request for interview: {request.interviewId}")
        
        # Send emails using the email service
        response = EmailService.send_interview_emails(request)
        
        return response
    
    except Exception as e:
        logger.error(f"❌ Unexpected error in email endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return SendInterviewEmailResponse(
            success=False,
            message="Failed to send emails",
            error=str(e)
        )


# ============================================================================
# STARTUP/SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Print startup message"""
    print("\n")
    print("+" + "-"*68 + "+")
    print("|" + " "*68 + "|")
    print("|" + " SUCCESS: JD Generator API - STARTED".center(68) + "|")
    print("|" + " "*68 + "|")
    print("|" + f"  Running on: http://localhost:8000".ljust(68) + "|")
    print("|" + f"  Interactive Docs: http://localhost:8000/docs".ljust(68) + "|")
    print("|" + f"  Health Check: http://localhost:8000/health".ljust(68) + "|")
    print("|" + " "*68 + "|")
    print("|" + "Available Endpoints:".ljust(68) + "|")
    print("|" + "  * POST /generate-jd       - Generate JD from form data".ljust(68) + "|")
    print("|" + "  * POST /download-pdf      - Download JD as PDF (supports edits)".ljust(68) + "|")
    print("|" + "  * POST /extract-resumes   - Batch extract from multiple PDFs/DOCX".ljust(68) + "|")
    print("|" + "  * POST /extract-resume    - Extract from single PDF/DOCX (testing)".ljust(68) + "|")
    print("|" + "  * POST /score-candidate   - Score single candidate vs JD".ljust(68) + "|")
    print("|" + "  * POST /score-candidates  - Batch score candidates vs JD".ljust(68) + "|")
    print("|" + "  * POST /send-interview-email - Send interview email to candidate/interviewer".ljust(68) + "|")
    print("|" + "  * GET  /health            - API health check".ljust(68) + "|")
    print("|" + " "*68 + "|")
    print("+" + "-"*68 + "+")
    print("\n")
    # Shared async HTTP client — connection pool reused across all LLM calls
    ATSAnalyzer._http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(30.0),
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10)
    )
    # Async primitives must be created inside a running event loop
    ATSProcessor._semaphore = asyncio.Semaphore(ATSProcessor.CONCURRENCY_LIMIT)

    logger.info("JD Generator API startup complete")



@app.on_event("shutdown")
async def shutdown_event():
    """Print shutdown message"""
    if ATSAnalyzer._http_client is not None:
        await ATSAnalyzer._http_client.aclose()
    logger.info("JD Generator API shutting down")


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/", tags=["Info"])
async def root():
    """Root endpoint with API info"""
    return {
        "service": "JD Generator API",
        "version": "1.0.0",
        "docs": "http://localhost:8000/docs",
        "health": "http://localhost:8000/health",
        "main_endpoint": "POST /generate-jd"
    }


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",  # Listen on all interfaces
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )