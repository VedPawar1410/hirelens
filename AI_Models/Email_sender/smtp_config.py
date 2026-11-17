"""SMTP Configuration Handler"""

import os
from pathlib import Path
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load .env from AI_Models directory (parent of Email_sender)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, verbose=True)

logger.debug(f"Loading .env from: {env_path}")


class SMTPConfig:
    """SMTP Configuration from environment variables"""
    
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SENDER_EMAIL = os.getenv("SENDER_EMAIL", "")
    SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "")
    SENDER_NAME = os.getenv("SENDER_NAME", "HR Team - Acme Corp")
    
    # For Gmail: Use "App Password" (not regular password)
    # 1. Enable 2FA on Google account
    # 2. Generate App Password: https://myaccount.google.com/apppasswords
    # 3. Copy 16-char password to SENDER_PASSWORD
    
    @classmethod
    def validate(cls):
        """Validate SMTP configuration"""
        if not cls.SENDER_EMAIL:
            logger.error(f"❌ SENDER_EMAIL is empty. Check .env file at: {env_path}")
            raise ValueError("SENDER_EMAIL not configured in .env")
        
        if not cls.SENDER_PASSWORD:
            logger.error(f"❌ SENDER_PASSWORD is empty. Check .env file at: {env_path}")
            raise ValueError("SENDER_PASSWORD not configured in .env")
        
        logger.info(f"✅ SMTP Config Valid: {cls.SENDER_EMAIL} on {cls.SMTP_SERVER}:{cls.SMTP_PORT}")
        return True
    
    @classmethod
    def to_dict(cls):
        """Return config as dictionary"""
        return {
            "smtp_server": cls.SMTP_SERVER,
            "smtp_port": cls.SMTP_PORT,
            "sender_email": cls.SENDER_EMAIL,
            "sender_name": cls.SENDER_NAME,
        }