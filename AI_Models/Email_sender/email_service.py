"""Main Email Service for sending interview notification emails"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import logging
from datetime import datetime, timezone
from typing import Dict, Any

from .models import SendInterviewEmailRequest, SendInterviewEmailResponse, EmailStatus, EmailSendData
from .templates import EmailTemplates
from .smtp_config import SMTPConfig
from .utils import (
    Base64FileDecoder,
    TemplateVariableSubstituter,
    DateTimeFormatter,
    EmailValidator
)

logger = logging.getLogger(__name__)


class EmailService:
    """Service to send interview notification emails via SMTP"""

    @staticmethod
    def send_interview_emails(request: SendInterviewEmailRequest) -> SendInterviewEmailResponse:
        """
        Send interview notification emails to candidate and interviewer.

        Opens a single authenticated SMTP connection, sends both emails, then closes.
        Each send is attempted independently so a failure on one does not prevent the other.
        """
        try:
            logger.info(f"📧 Starting email service for interview: {request.interviewId}")

            # Validate SMTP config
            SMTPConfig.validate()

            # Validate email addresses
            is_valid, error_msg = EmailValidator.validate_email_list([
                request.candidateEmail,
                request.interviewerEmail
            ])

            if not is_valid:
                logger.error(f"❌ Email validation failed: {error_msg}")
                return SendInterviewEmailResponse(
                    success=False,
                    message="Email validation failed",
                    error=error_msg
                )

            # Decode resume and JD from Base64
            resume_path = None
            jd_path = None

            try:
                logger.info("🔄 Decoding resume and JD from Base64...")
                resume_path = Base64FileDecoder.decode_to_temp_file(
                    request.resumeBase64,
                    "resume.pdf"
                )
                jd_path = Base64FileDecoder.decode_to_temp_file(
                    request.jdBase64,
                    "jd.pdf"
                )
            except Exception as e:
                logger.error(f"❌ Failed to decode attachments: {str(e)}")
                return SendInterviewEmailResponse(
                    success=False,
                    message="Failed to process attachments",
                    error=str(e)
                )

            # Prepare email variables
            email_vars = EmailService._prepare_email_variables(request)

            # Track per-email outcomes
            candidate_status = "failed"
            candidate_error = None
            candidate_timestamp = None

            interviewer_status = "failed"
            interviewer_error = None
            interviewer_timestamp = None

            # Open one SMTP connection for both emails
            try:
                server = smtplib.SMTP(SMTPConfig.SMTP_SERVER, SMTPConfig.SMTP_PORT, timeout=30)
                server.starttls()
                server.login(SMTPConfig.SENDER_EMAIL, SMTPConfig.SENDER_PASSWORD)
            except smtplib.SMTPAuthenticationError:
                raise Exception("SMTP authentication failed. Check SENDER_EMAIL and SENDER_PASSWORD")
            except Exception as e:
                raise Exception(f"SMTP connection failed: {str(e)}")

            try:
                # Send candidate email
                try:
                    logger.info(f"📤 Sending candidate email to: {request.candidateEmail}")
                    EmailService._send_candidate_email(server, request, email_vars, resume_path, jd_path)
                    candidate_status = "sent"
                    candidate_timestamp = datetime.now(timezone.utc)
                    logger.info(f"✅ Candidate email sent to {request.candidateEmail}")
                except Exception as e:
                    candidate_error = str(e)
                    logger.error(f"❌ Failed to send candidate email: {str(e)}")

                # Send interviewer email
                try:
                    logger.info(f"📤 Sending interviewer email to: {request.interviewerEmail}")
                    EmailService._send_interviewer_email(server, request, email_vars, resume_path, jd_path)
                    interviewer_status = "sent"
                    interviewer_timestamp = datetime.now(timezone.utc)
                    logger.info(f"✅ Interviewer email sent to {request.interviewerEmail}")
                except Exception as e:
                    interviewer_error = str(e)
                    logger.error(f"❌ Failed to send interviewer email: {str(e)}")
            finally:
                try:
                    server.quit()
                except Exception:
                    pass

            # Cleanup temp files
            if resume_path:
                Base64FileDecoder.cleanup_temp_file(resume_path)
            if jd_path:
                Base64FileDecoder.cleanup_temp_file(jd_path)

            # Build typed response
            success = candidate_status == "sent" and interviewer_status == "sent"
            data = EmailSendData(
                candidateEmailStatus=EmailStatus(
                    status=candidate_status,
                    recipient=request.candidateEmail,
                    timestamp=candidate_timestamp,
                    error=candidate_error
                ),
                interviewerEmailStatus=EmailStatus(
                    status=interviewer_status,
                    recipient=request.interviewerEmail,
                    timestamp=interviewer_timestamp,
                    error=interviewer_error
                )
            )

            logger.info(
                f"{'✅' if success else '⚠️'} Email service completed: "
                f"candidate={candidate_status}, interviewer={interviewer_status}"
            )

            error_summary = None
            if not success:
                parts = []
                if candidate_error:
                    parts.append(f"Candidate: {candidate_error}")
                if interviewer_error:
                    parts.append(f"Interviewer: {interviewer_error}")
                error_summary = "; ".join(parts)

            return SendInterviewEmailResponse(
                success=success,
                message="Emails sent successfully." if success else "Some emails failed to send",
                data=data,
                error=error_summary
            )

        except Exception as e:
            logger.error(f"❌ Unexpected error in email service: {str(e)}")
            import traceback
            traceback.print_exc()

            return SendInterviewEmailResponse(
                success=False,
                message="Failed to send emails",
                error=str(e)
            )

    @staticmethod
    def _prepare_email_variables(request: SendInterviewEmailRequest) -> Dict[str, Any]:
        """Build the substitution dict used by all templates."""
        return {
            "candidateName": request.candidateName,
            "candidateEmail": request.candidateEmail,
            "interviewerName": request.interviewerName,
            "interviewerEmail": request.interviewerEmail,
            "jobTitle": request.jobTitle,
            "companyName": request.companyName,
            "interviewRound": request.interviewRound,
            "interviewType": request.interviewType,
            "interviewMode": request.interviewMode,
            "startTime": DateTimeFormatter.to_readable_format(request.startTime),
            "endTime": DateTimeFormatter.to_readable_format(request.endTime),
            "durationMinutes": request.durationMinutes,
            "timezone": request.timezone,
            "meetingLink": request.meetingLink or "Link will be shared soon",
            "location": request.location or "N/A",
            "createdByUserName": request.createdByUserName,
            "createdByUserEmail": request.createdByUserEmail,
            "additionalInstructions": request.additionalInstructions or ""
        }

    @staticmethod
    def _build_instructions_block(instructions: str) -> str:
        """Return an HTML table row for additional instructions, or empty string if none."""
        if not instructions:
            return ""
        return (
            '<tr>'
            '<td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Additional Instructions</td>'
            f'<td style="padding: 8px; border-bottom: 1px solid #ddd;">{instructions}</td>'
            '</tr>'
        )

    @staticmethod
    def _send_candidate_email(
        server: smtplib.SMTP,
        request: SendInterviewEmailRequest,
        variables: Dict[str, Any],
        resume_path: str,
        jd_path: str
    ):
        subject_template, body_template = EmailTemplates.get_candidate_template(request.interviewRound)

        # Inject the additionalInstructions row so templates stay simple
        enriched = {
            **variables,
            "additionalInstructionsBlock": EmailService._build_instructions_block(
                variables.get("additionalInstructions", "")
            )
        }

        subject = TemplateVariableSubstituter.substitute(subject_template, enriched)
        body = TemplateVariableSubstituter.substitute(body_template, enriched)

        EmailService._send_email(
            server=server,
            to_email=request.candidateEmail,
            subject=subject,
            body=body,
            attachments=[
                {"file_path": resume_path, "filename": f"{request.candidateName.replace(' ', '_')}_resume.pdf"},
                {"file_path": jd_path, "filename": f"{request.jobTitle.replace(' ', '_')}_jd.pdf"}
            ]
        )

    @staticmethod
    def _send_interviewer_email(
        server: smtplib.SMTP,
        request: SendInterviewEmailRequest,
        variables: Dict[str, Any],
        resume_path: str,
        jd_path: str
    ):
        subject_template, body_template = EmailTemplates.get_interviewer_template()

        subject = TemplateVariableSubstituter.substitute(subject_template, variables)
        body = TemplateVariableSubstituter.substitute(body_template, variables)

        EmailService._send_email(
            server=server,
            to_email=request.interviewerEmail,
            subject=subject,
            body=body,
            attachments=[
                {"file_path": resume_path, "filename": f"{request.candidateName.replace(' ', '_')}_resume.pdf"},
                {"file_path": jd_path, "filename": f"{request.jobTitle.replace(' ', '_')}_jd.pdf"}
            ]
        )

    @staticmethod
    def _send_email(server: smtplib.SMTP, to_email: str, subject: str, body: str, attachments: list = None):
        """
        Build and send one email on an already-authenticated SMTP server.

        Uses MIMEMultipart("mixed") so HTML body and file attachments coexist correctly.
        """
        try:
            message = MIMEMultipart("mixed")
            message["From"] = f"{SMTPConfig.SENDER_NAME} <{SMTPConfig.SENDER_EMAIL}>"
            message["To"] = to_email
            message["Subject"] = subject

            message.attach(MIMEText(body, "html"))

            if attachments:
                for attachment in attachments:
                    try:
                        with open(attachment["file_path"], "rb") as f:
                            part = MIMEBase("application", "octet-stream")
                            part.set_payload(f.read())

                        encoders.encode_base64(part)
                        part.add_header(
                            "Content-Disposition",
                            f'attachment; filename="{attachment["filename"]}"'
                        )
                        message.attach(part)
                        logger.debug(f"✅ Attached: {attachment['filename']}")
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to attach {attachment['filename']}: {str(e)}")

            server.send_message(message)
            logger.info(f"✅ Email sent to {to_email}")

        except smtplib.SMTPException as e:
            logger.error(f"❌ SMTP Error sending to {to_email}: {str(e)}")
            raise Exception(f"SMTP error: {str(e)}")

        except Exception as e:
            logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")
            raise
