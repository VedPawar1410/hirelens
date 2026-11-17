"""Pydantic models for email service request/response"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class SendInterviewEmailRequest(BaseModel):
    """Request from .NET Backend to send interview notification emails"""

    interviewId: str
    candidateName: str
    candidateEmail: EmailStr
    interviewerName: str
    interviewerEmail: EmailStr
    jobTitle: str
    companyName: str = "Acme Corp"
    interviewRound: str  # "L1", "L2", "L3", "L4"
    interviewType: str  # "Technical", "HR", etc.
    interviewMode: str  # "online", "on-site", "hybrid"
    startTime: datetime
    endTime: datetime
    durationMinutes: int
    timezone: str = "Asia/Kolkata"
    meetingLink: Optional[str] = None
    location: Optional[str] = None
    createdByUserName: str
    createdByUserEmail: EmailStr
    resumeBase64: str  # Base64 encoded resume PDF
    jdBase64: str  # Base64 encoded JD PDF
    additionalInstructions: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "interviewId": "550e8400-e29b-41d4-a716-446655440000",
                "candidateName": "John Doe",
                "candidateEmail": "john@example.com",
                "interviewerName": "Jane Smith",
                "interviewerEmail": "jane@example.com",
                "jobTitle": "Senior AI Engineer",
                "companyName": "Acme Corp",
                "interviewRound": "L1",
                "interviewType": "Technical",
                "interviewMode": "online",
                "startTime": "2026-05-25T10:00:00+05:30",
                "endTime": "2026-05-25T11:00:00+05:30",
                "durationMinutes": 60,
                "timezone": "Asia/Kolkata",
                "meetingLink": "https://teams.microsoft.com/l/meetup-join/19:meeting_123",
                "location": None,
                "createdByUserName": "HR Admin",
                "createdByUserEmail": "hr@example.com",
                "resumeBase64": "JVBERi0xLjQKJ...",
                "jdBase64": "JVBERi0xLjQKJ...",
                "additionalInstructions": "Please prepare coding questions"
            }
        }


class EmailStatus(BaseModel):
    """Status of an individual email send attempt"""
    status: str  # "sent" or "failed"
    recipient: str
    timestamp: Optional[datetime] = None
    error: Optional[str] = None


class EmailSendData(BaseModel):
    """Per-email status breakdown returned in the response"""
    candidateEmailStatus: EmailStatus
    interviewerEmailStatus: EmailStatus


class SendInterviewEmailResponse(BaseModel):
    """Response from email service"""
    success: bool
    message: str
    data: Optional[EmailSendData] = None
    error: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Emails sent successfully.",
                "data": {
                    "candidateEmailStatus": {
                        "status": "sent",
                        "recipient": "john@example.com",
                        "timestamp": "2026-05-28T10:00:00",
                        "error": None
                    },
                    "interviewerEmailStatus": {
                        "status": "sent",
                        "recipient": "jane@example.com",
                        "timestamp": "2026-05-28T10:00:01",
                        "error": None
                    }
                }
            }
        }
