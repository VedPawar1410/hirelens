import re
import pathlib
from markupsafe import Markup, escape

ABOUT_US_TEXT = "At Acme Corp, we are more than just a team – we are a product development community driven by a shared vision. Our values shape who we are, what we do, and how we interact with our peers and our customers. We're not just seeking any regular engineer; we want individuals who identify with our core values and are passionate about software development."

def get_logo_path() -> str:
    """
    Get the absolute path to the logo file for WeasyPrint
    Returns file:// URL format which WeasyPrint can load
    """
    script_dir = pathlib.Path(__file__).parent.absolute()
    logo_file = script_dir / "assets" / "logo.svg"
    
    if logo_file.exists():
        return logo_file.as_uri()
    else:
        print(f"Warning: Logo file not found at {logo_file}")
        return ""

def format_indian_rupees(amount: int) -> str:
    """
    Format amount in Indian rupee format with commas
    Example: 100000 -> 1,00,000, 1000000 -> 10,00,000
    """
    if not isinstance(amount, int):
        return str(amount)
    
    amount_str = str(amount)
    if amount < 100000:
        return f"{amount:,}"
    
    last_three = amount_str[-3:]
    remaining = amount_str[:-3]
    
    parts = []
    for i in range(len(remaining), 0, -2):
        start = max(0, i - 2)
        parts.insert(0, remaining[start:i])
    
    formatted = ','.join(parts) + ',' + last_three if parts else last_three
    return formatted

def bold_keywords(text: str) -> Markup:
    """Bold important keywords in text for PDF display (context-aware).

    Returns a markupsafe.Markup so Jinja2 (autoescape=True) won't
    re-escape the intentional <b> tags we add here.

    Safety contract:
      1. escape(text) HTML-escapes all user-supplied characters first.
      2. Only then do we inject our own <b> tags via regex.
      3. Wrapping in Markup tells Jinja2 the string is already safe.
    """
    if not text:
        return Markup(text) if text is not None else text

    negative_contexts = ['no prior', 'not required', 'optional', 'no experience', 'not necessary']
    lower_text = text.lower()

    for context in negative_contexts:
        if context in lower_text:
            # No bolding — just escape and mark safe
            return Markup(escape(text))

    replacements = [
        (r'\b(\d+(?:-\d+)?\+?\s*years?)\b', r'<b>\1</b>'),
        (r'\b(required)\b', r'<b>\1</b>'),
        (r'\b(proficiency)\b', r'<b>\1</b>'),
        (r'\b(expertise)\b', r'<b>\1</b>'),
        (r'\b(strong)\b', r'<b>\1</b>'),
        (r'\b(excellent)\b', r'<b>\1</b>'),
        (r'\b(proven)\b', r'<b>\1</b>'),
    ]

    # Step 1: escape user-supplied text to neutralise any HTML special chars
    result = str(escape(text))

    # Step 2: apply bold patterns on the now-safe escaped string
    for pattern, replacement in replacements:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    # Step 3: mark as safe — we escaped first, so only our <b> tags remain
    return Markup(result)

def enforce_about_us(jd_content: str) -> str:
    """
    Enforce the fixed "About Us" text in the generated JD.
    Handles various header styles and is case-insensitive.
    """
    if not jd_content:
        return jd_content
        
    # List of patterns to try and replace
    patterns = [
        # Bold markdown: **About Us** or **About us**
        (r"(\*\*About\s+Us\*\*\n+).*?(?=\n+(?:\*\*|###|Role Overview))", r"\1" + ABOUT_US_TEXT),
        # H3 markdown: ### About Us or ### About us
        (r"(###\s+About\s+Us\n+).*?(?=\n+(?:\*\*|###|Role Overview))", r"\1" + ABOUT_US_TEXT),
        # Plain text with colon: About Us: or About us:
        (r"(\bAbout\s+us:\n*).*?(?=\n+(?:[A-Z][a-z]+|Role Overview))", r"\1" + ABOUT_US_TEXT),
        # Catch-all for "About Us" followed by anything until next likely section
        (r"(?i)(About\s+Us:?\s*\n+).*?(?=\n+(?:Role Overview|\*\*|###))", r"\1" + ABOUT_US_TEXT)
    ]
    
    result = jd_content
    found = False
    
    for pattern, replacement in patterns:
        if re.search(pattern, result, re.DOTALL | re.IGNORECASE):
            result = re.sub(pattern, replacement, result, flags=re.DOTALL | re.IGNORECASE)
            found = True
            
    # Secondary check: If the header exists but content wasn't replaced by specific patterns
    if not found:
        # Look for any variation of "About Us" header
        header_match = re.search(r"(?i)(\*\*About\s+Us\*\*|###\s+About\s+Us|About\s+us:)", result)
        if header_match:
            header = header_match.group(0)
            # Replace from the header until the next section
            result = re.sub(
                r"(?i)(" + re.escape(header) + r"\s*\n+).*?(?=\n+(?:Role Overview|\*\*|###|$))",
                r"\1" + ABOUT_US_TEXT,
                result,
                flags=re.DOTALL
            )

    return result
