"""
Data Parser Module

Parses candidate information from extracted resume text.
Extracts: name, email, phone, linkedin, github.
"""

import re
from typing import Optional, Dict, Any, Tuple
import logging
import spacy

# # Try relative import first, fallback to absolute if needed
# try:
#     from resume_extraction.scraper import LinkedInScraper
# except ImportError:
#     try:
#         from scraper import LinkedInScraper
#     except ImportError:
#         LinkedInScraper = None

logger = logging.getLogger(__name__)

# Cache for spaCy NLP model to avoid reloading
_nlp_cache = None

def get_nlp():
    """Lazily loads the spaCy NLP model."""
    global _nlp_cache
    if _nlp_cache is None:
        try:
            # Try to load small English model
            _nlp_cache = spacy.load("en_core_web_sm")
        except Exception as e:
            logger.warning(f"Could not load spaCy model 'en_core_web_sm': {str(e)}")
            try:
                # Fallback to loading by name if regular load fails
                import en_core_web_sm
                _nlp_cache = en_core_web_sm.load()
            except Exception as e2:
                logger.error(f"Failed to load spaCy model entirely: {str(e2)}")
    return _nlp_cache


class ContactInfoParser:
    """Parse contact information from resume text."""

    # Email pattern
    EMAIL_PATTERN = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    
    # Phone patterns: 10 digits, with dashes, with spaces, with country code
    PHONE_PATTERN = r'(?:\+\d{1,3}[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b|\b\d{10}\b'
    
    # LinkedIn URL pattern (handles .com, .in, etc.)
    LINKEDIN_PATTERN = r'(?:https?://)?(?:www\.)?linkedin\.[a-z]{2,}/in/[a-zA-Z0-9\-_./]+'
    
    # GitHub URL pattern
    GITHUB_PATTERN = r'(?:https?://)?(?:www\.)?github\.com/[\w-]+'

    @staticmethod
    def extract_email(text: str) -> Optional[str]:
        """
        Extract primary email address from text.
        
        Args:
            text: Resume text
            
        Returns:
            First found email address or None
        """
        try:
            matches = re.findall(ContactInfoParser.EMAIL_PATTERN, text)
            if matches:
                # Return first valid email (usually the primary one)
                return matches[0]
        except Exception as e:
            logger.warning(f"Error extracting email: {str(e)}")
        return None

    @staticmethod
    def extract_phone(text: str) -> Optional[str]:
        """
        Extract primary phone number from text.

        Args:
            text: Resume text

        Returns:
            First found phone number (formatted) or None
        """
        try:
            matches = re.findall(ContactInfoParser.PHONE_PATTERN, text)
            if matches:
                # Extract first match and format it
                for match in matches:
                    if isinstance(match, tuple):
                        # Join the tuple parts of the phone number
                        phone = ''.join(match)
                    else:
                        phone = match

                    # Clean and return the first valid phone number
                    phone = re.sub(r'[^\d+]', '', phone)
                    if len(phone) >= 10:  # Ensure it's a valid phone number length
                        return phone

            # Alternative: just get 10 consecutive digits
            digit_pattern = r'\b\d{10}\b|\b\+\d{1,3}\d{9,}\b'
            digit_matches = re.findall(digit_pattern, text)
            if digit_matches:
                return digit_matches[0]

        except Exception as e:
            logger.warning(f"Error extracting phone: {str(e)}")
        return None

    @staticmethod
    def extract_linkedin(text: str) -> Optional[str]:
        """
        Extract LinkedIn profile URL from text.
        
        Args:
            text: Resume text
            
        Returns:
            LinkedIn URL or None
        """
        try:
            # First, try to find a complete match on a single line
            matches = re.findall(ContactInfoParser.LINKEDIN_PATTERN, text, re.IGNORECASE)
            
            # If no matches or they look truncated (e.g. end with a dash), 
            # try a more aggressive multi-line search by removing newlines.
            # IMPORTANT: Only do this for the body of the text to avoid gluing links in the footer.
            body_text = text.split("--- Extracted Hyperlinks ---")[0]
            text_clean = body_text.replace('\n', '')
            # Also try with spaces (standard approach)
            text_spaced = text.replace('\n', ' ')
            
            matches_clean = re.findall(ContactInfoParser.LINKEDIN_PATTERN, text_clean, re.IGNORECASE)
            matches_spaced = re.findall(ContactInfoParser.LINKEDIN_PATTERN, text_spaced, re.IGNORECASE)
            
            all_matches = list(set(matches + matches_clean + matches_spaced))
            if all_matches:
                # Pick the longest match
                url = max(all_matches, key=len)
                
                if not url.startswith('http'):
                    url = 'https://' + url
                return url
        except Exception as e:
            logger.warning(f"Error extracting LinkedIn: {str(e)}")
        return None

    @staticmethod
    def extract_github(text: str) -> Optional[str]:
        """
        Extract GitHub profile URL from text.
        
        Args:
            text: Resume text
            
        Returns:
            GitHub URL or None
        """
        try:
            matches = re.findall(ContactInfoParser.GITHUB_PATTERN, text, re.IGNORECASE)
            if matches:
                # Normalize the URL
                url = matches[0]
                if not url.startswith('http'):
                    url = 'https://' + url
                return url
        except Exception as e:
            logger.warning(f"Error extracting GitHub: {str(e)}")
        return None

    @staticmethod
    def _is_likely_name(line: str, common_headers: set) -> bool:
        """Helper to validate if a line likely contains a candidate name."""
        if not line or len(line) < 3 or len(line) > 50:
            return False
            
        if line.upper() in common_headers:
            return False

        # Blacklist of common resume keywords, months, metrics, and action verbs
        name_blacklist = {
            "MANAGEMENT", "MANAGER", "PRODUCT", "DEVELOPER", "ENGINEER", "SPECIALIZING",
            "EXPERIENCE", "AI", "AGENT", "AGENTS", "API", "WHATSAPP", "PAYMENTS", "CONTACT",
            "CENTERS", "CRM", "INTEGRATIONS", "TECHNOLOGIES", "SOLUTIONS", "UNIVERSITY", 
            "COLLEGE", "INSTITUTE", "SCHOOL", "TECHNOLOGY", "BUSINESS", "OFFICER", "DIRECTOR",
            "SENIOR", "INTERN", "LEAD", "CONSULTANT", "ARCHITECT", "JUNIOR", "B.TECH", "M.TECH",
            "AND", "FOR", "THE", "WITH", "FROM", "LLC", "INC", "CORP", "PAGE", "PRESENT",
            "ARR", "DAU", "MAU", "NPS", "CSAT", "MOM", "YOY", "GSF", "IIT", "IIM", "ISB",
            "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "SEPT", "OCT", "NOV", "DEC",
            "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
            "LED", "BUILD", "BUILT", "LAUNCHED", "MANAGED", "DEVELOPED", "DESIGNED", "SCALED", "DRIVING", "SPECIALIZED", "DELIVERING", "CREATING"
        }

        # Stricter checks to rule out dates, metrics, and complex lines
        if any(char.isdigit() for char in line):
            return False
            
        # Rejects lines with common resume separators/symbols (–, —, →, |, ·, &, ●, ■)
        if any(char in "@+:/()–—|_→₹·&●■" for char in line):
            return False

        words = line.split()
        if not (2 <= len(words) <= 5):
            return False

        # Title Case check: all words should start with uppercase
        # (Allows all caps as well since isupper() is true for caps)
        if not all(word[0].isupper() for word in words if any(c.isalpha() for c in word)):
            return False

        # Blacklist check
        words_upper = [w.upper().strip(',').strip('.') for w in words]
        if any(w in name_blacklist for w in words_upper):
            return False

        # Ensure it's not a full sentence (usually has lowercase connectors or more than 5 words)
        return True

    @staticmethod
    def _extract_name_from_linkedin_slug(url: str) -> Optional[str]:
        """
        Parses the candidate name from a LinkedIn profile slug.
        e.g., https://linkedin.com/in/john-doe-12345 -> 'John Doe'
        """
        if not url:
            return None
            
        try:
            # Extract the slug part
            match = re.search(r'/in/([a-zA-Z0-9\-_./]+)/?$', url)
            if not match:
                return None
                
            slug = match.group(1).split('/')[0] # Get only the main part of the slug if it has subpaths
            
            # Remove trailing numbers or hash-like patterns (e.g. -1234a56)
            # LinkedIn slugs often follow the format: first-last-123456
            slug = re.sub(r'(-[0-9a-f]+)+$', '', slug)
            
            # Also handle underscores or dashes as separators
            name_parts = re.split(r'[-_.]', slug)
            
            # Clean and filter parts
            cleaned_parts = []
            for part in name_parts:
                if len(part) < 2: continue # skip initials or single chars if possible, but keep if it looks like a name
                # Capitalize
                cleaned_parts.append(part.capitalize())
            
            if len(cleaned_parts) >= 2:
                name = " ".join(cleaned_parts)
                # Basic validation: ensure it doesn't look like junk
                if any(c.isalpha() for c in name):
                    return name
            elif len(cleaned_parts) == 1:
                # Fallback for single-word slugs (e.g. /in/rahulkakk)
                # If it's a single word but reasonably long and contains letters, return it capitalized
                name = cleaned_parts[0]
                if len(name) >= 3 and any(c.isalpha() for c in name):
                    return name
                    
        except Exception as e:
            logger.debug(f"Error parsing slug: {str(e)}")
            
        return None

    @staticmethod
    def extract_name(text: str) -> tuple[Optional[str], Optional[str]]:
        """
        Extract candidate name from text using a multi-strategy approach.
        1. LinkedIn Scraping: Extract from profile link (highly accurate source).
        2. Contact Proximity: Search near email/phone.
        3. spaCy NLP: Identify PERSON entities in the text.
        4. Filtered Heuristic: Search top lines with strict rules.
        5. Global Search: Last resort with strict validation.

        Args:
            text: Resume text

        Returns:
            Tuple of (Extracted name or None, Method name or None)
        """
        potential_single_word_name = None
        try:
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            if not lines:
                return None, None

            # Common section headers
            common_headers = {
                "PROFILE SUMMARY", "EDUCATION", "EXPERIENCE", "SKILLS",
                "WORK EXPERIENCE", "PROJECTS", "CERTIFICATIONS", "ACHIEVEMENTS",
                "PERSONAL INFORMATION", "CONTACT", "LANGUAGES", "SUMMARY", "PROFILE",
                "OBJECTIVE", "TECHNICAL SKILLS", "EXPERTISE", "INTERESTS", "CORE EXPERTISE"
            }

            # Extract basic contact info early as it's used as an anchor for multiple strategies
            email = ContactInfoParser.extract_email(text)
            phone = ContactInfoParser.extract_phone(text)

            # Find first occurrences of contact info to use as anchors
            email_first_idx = -1
            phone_first_idx = -1
            for i, line in enumerate(lines):
                if email_first_idx == -1 and email and email in line:
                    email_first_idx = i
                if phone_first_idx == -1 and phone and phone in line:
                    phone_first_idx = i
                if email_first_idx != -1 and phone_first_idx != -1:
                    break
            
            target_indices = [idx for idx in [email_first_idx, phone_first_idx] if idx != -1]
            target_indices.sort()

            # Strategy 1: LinkedIn Slug Parsing (Fast & Reliable)
            linkedin_url = ContactInfoParser.extract_linkedin(text)
            if linkedin_url:
                slug_name = ContactInfoParser._extract_name_from_linkedin_slug(linkedin_url)
                if slug_name:
                    # Attempt to "recover" middle names/initials by cross-referencing with top lines
                    slug_parts = [p.lower() for p in slug_name.split() if len(p) > 1]
                    for i in range(min(15, len(lines))):
                        line = lines[i]
                        line_lower = line.lower()
                        # If the line contains all significant parts of the slug name
                        if all(part in line_lower for part in slug_parts):
                            # Clean the line (remove phone/email if present on same line)
                            clean_line = line
                            if email: clean_line = clean_line.replace(email, "")
                            if phone: clean_line = clean_line.replace(phone, "")
                            clean_line = re.sub(r'[|:+,/()–—|_→₹·&●■#\-]', ' ', clean_line)
                            clean_line = re.sub(r'\d+', ' ', clean_line)
                            clean_line = " ".join(clean_line.split()).strip()
                            
                            if ContactInfoParser._is_likely_name(clean_line, common_headers):
                                return clean_line, "LinkedIn Slug Parsing"
                                
                    # If we found a slug name but couldn't "recover" it from the text,
                    # we still return it if it has at least 2 parts.
                    if " " in slug_name:
                        return slug_name, "LinkedIn Slug Parsing"
                    
                    # Store single-word slug for later fallback if all else fails
                    potential_single_word_name = slug_name
                else:
                    potential_single_word_name = None
            else:
                potential_single_word_name = None

            # Strategy 2: In-line Contact Name (Names on same line as email/phone)
            for idx in target_indices:
                line = lines[idx]
                if len(line) < 100: # Only process reasonable length lines
                    # Strip email and phone
                    clean_line = line
                    if email: clean_line = clean_line.replace(email, "")
                    if phone: clean_line = clean_line.replace(phone, "")
                    
                    # Strip separators and common phone fragments (+91, / etc)
                    # We use a broad range of separators seen in resumes
                    clean_line = re.sub(r'[|:+,/()–—|_→₹·&●■#\-]', ' ', clean_line)
                    # Remove extra digits (often parts of phone numbers)
                    clean_line = re.sub(r'\d+', ' ', clean_line)
                    
                    clean_line = " ".join(clean_line.split()).strip()
                    
                    if ContactInfoParser._is_likely_name(clean_line, common_headers):
                        return clean_line, "In-line Contact"

            # Strategy 3 implementation (Proximity check lines before)
            for idx in target_indices:
                for j in range(max(0, idx - 10), idx):
                    if ContactInfoParser._is_likely_name(lines[j], common_headers):
                        return lines[j], "Contact Proximity"

            # Strategy 4: spaCy NLP Name Extraction (Fallback)
            nlp = get_nlp()
            if nlp:
                # Process the first 20 lines (where name usually is) to save time
                header_text = "\n".join(lines[:20])
                doc = nlp(header_text)
                for ent in doc.ents:
                    if ent.label_ == "PERSON":
                        name = ent.text.strip()
                        # Basic validation for the extracted entity
                        if len(name.split()) >= 2 and len(name) < 50 and "\n" not in name:
                            # Strategy 3 Improvement: Reject if it's just a fragment of a much longer line
                            # (Names usually occupy the majority of their line)
                            original_line = next((l for l in lines[:20] if name in l), "")
                            if original_line and len(name) < len(original_line) * 0.5:
                                continue

                            # Verify with our likelihood logic to avoid headers matching as PERSON
                            if ContactInfoParser._is_likely_name(name, common_headers):
                                return name, "spaCy NLP (PERSON)"

            # # Strategy 5: LinkedIn Selenium Scraping (Authoritative Fallback)
            # # Moved to lower priority because it's slow. Only fires if above fail.
            # if linkedin_url and LinkedInScraper:
            #     scraped_name = LinkedInScraper.extract_name_from_url(linkedin_url)
            #     if scraped_name:
            #         return scraped_name, "LinkedIn Scraping"

            # Strategy 6: Filtered Heuristic Search (Top Search)
            for i in range(min(15, len(lines))):
                if ContactInfoParser._is_likely_name(lines[i], common_headers):
                    return lines[i], "Top Search (Heuristic)"

            # Strategy 7: Global Strict Search (Last Resort)
            for line in lines:
                if ContactInfoParser._is_likely_name(line, common_headers):
                    return line, "Global Strict Search"

            # Strategy 8: Single-word LinkedIn Slug Fallback
            if potential_single_word_name:
                return potential_single_word_name, "LinkedIn Slug Fallback"

        except Exception as e:
            logger.warning(f"Error extracting name: {str(e)}")

        return None, None


class ResumeParser:
    """Main parser for extracting all resume information."""

    @staticmethod
    def parse(text: str) -> Dict[str, Any]:
        """
        Parse resume text and extract contact information.
        
        Args:
            text: Raw extracted resume text
            
        Returns:
            Dictionary with extracted fields: {
                "name": str or None,
                "email": str or None,
                "phone": str or None,
                "linkedin": str or None,
                "github": str or None,
                "content": str (first 500 chars)
            }
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for parsing")
            return {
                "name": None,
                "email": None,
                "phone": None,
                "linkedin": None,
                "github": None,
                "content": ""
            }
        
        try:
            # Clean the text
            text = text.strip()
            
            # Extract name and method
            name, method = ContactInfoParser.extract_name(text)

            # Extract other fields
            parsed = {
                "name": name,
                "extraction_method": method,
                "email": ContactInfoParser.extract_email(text),
                "phone": ContactInfoParser.extract_phone(text),
                "linkedin": ContactInfoParser.extract_linkedin(text),
                "github": ContactInfoParser.extract_github(text),
                "content": text[:1000] if len(text) > 1000 else text  
            }
            
            logger.info(f"Successfully parsed resume: {parsed.get('name', 'Unknown')} using {method}")
            return parsed
            
        except Exception as e:
            logger.error(f"Error parsing resume: {str(e)}")
            return {
                "name": None,
                "extraction_method": None,
                "email": None,
                "phone": None,
                "linkedin": None,
                "github": None,
                "content": text[:500]
            }
