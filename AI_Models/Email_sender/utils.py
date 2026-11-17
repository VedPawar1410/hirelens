"""Utility functions for email service"""

import base64
import os
import re
import logging
from typing import Dict, Any, Tuple
from datetime import datetime
import tempfile

logger = logging.getLogger(__name__)


class Base64FileDecoder:
    """Decode Base64 files and manage temporary files"""
    
    @staticmethod
    def decode_to_temp_file(base64_string: str, filename: str) -> str:
        """
        Decode Base64 string to temporary file
        
        Args:
            base64_string: Base64 encoded content
            filename: Filename for the temp file (e.g., "resume.pdf")
        
        Returns:
            Path to temporary file
        
        Raises:
            ValueError: If decoding fails
        """
        try:
            # Decode Base64
            file_content = base64.b64decode(base64_string)
            
            # Create temp file
            temp_dir = tempfile.gettempdir()
            stem, ext = os.path.splitext(filename)
            temp_path = os.path.join(temp_dir, f"hirelens_{stem}_{int(datetime.now().timestamp())}{ext}")
            
            # Write to file
            with open(temp_path, 'wb') as f:
                f.write(file_content)
            
            logger.info(f"✅ Decoded file: {temp_path} ({len(file_content)} bytes)")
            return temp_path
        
        except Exception as e:
            logger.error(f"❌ Failed to decode Base64: {str(e)}")
            raise ValueError(f"Failed to decode Base64 file: {str(e)}")
    
    @staticmethod
    def cleanup_temp_file(file_path: str):
        """
        Delete temporary file
        
        Args:
            file_path: Path to temp file
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.debug(f"🗑️ Cleaned up temp file: {file_path}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to cleanup temp file {file_path}: {str(e)}")


class TemplateVariableSubstituter:
    """Replace variables in email templates"""
    
    @staticmethod
    def substitute(template: str, variables: Dict[str, Any]) -> str:
        """
        Replace ${variable} with values from dictionary
        
        Args:
            template: Template string with ${variable} placeholders
            variables: Dictionary of variable names and values
        
        Returns:
            Substituted string
        """
        result = template
        
        for key, value in variables.items():
            if value is None:
                value = ""
            
            placeholder = f"${{{key}}}"
            result = result.replace(placeholder, str(value))
        
        return result
    
    @staticmethod
    def extract_variables(template: str) -> list:
        """
        Extract all variable names from template
        
        Args:
            template: Template string
        
        Returns:
            List of variable names found in template
        
        Example:
            extract_variables("Hello ${firstName}") → ["firstName"]
        """
        pattern = r'\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}'
        return re.findall(pattern, template)


class EmailValidator:
    """Validate email addresses"""
    
    @staticmethod
    def is_valid_email(email: str) -> bool:
        """
        Basic email validation
        
        Args:
            email: Email address to validate
        
        Returns:
            True if valid, False otherwise
        """
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_email_list(emails: list) -> Tuple[bool, str]:
        """
        Validate list of emails
        
        Args:
            emails: List of email addresses
        
        Returns:
            (is_valid, error_message)
        """
        invalid_emails = [e for e in emails if not EmailValidator.is_valid_email(e)]
        
        if invalid_emails:
            return False, f"Invalid emails: {', '.join(invalid_emails)}"
        
        return True, ""


class DateTimeFormatter:
    """Format datetime for display"""
    
    @staticmethod
    def to_readable_format(dt: datetime) -> str:
        """
        Format datetime to readable format
        
        Args:
            dt: datetime object
        
        Returns:
            Formatted string (e.g., "Monday, May 26, 2026 at 10:30 AM")
        """
        return dt.strftime("%A, %B %d, %Y at %I:%M %p")
    
    @staticmethod
    def to_iso_format(dt: datetime) -> str:
        """
        Format datetime to ISO format
        
        Args:
            dt: datetime object
        
        Returns:
            ISO format string
        """
        return dt.isoformat()
