import logging
import re
from typing import Optional
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

logger = logging.getLogger(__name__)

class LinkedInScraper:
    """Utility to scrape candidate information from LinkedIn profile URLs."""

    @staticmethod
    def extract_name_from_url(url: str) -> Optional[str]:
        """
        Extract the candidate's name from a LinkedIn profile URL using Selenium.
        
        Args:
            url: LinkedIn profile URL
            
        Returns:
            Extracted name or None
        """
        if not url or "linkedin.com/in/" not in url:
            return None

        driver = None
        try:
            logger.info(f"Attempting to scrape LinkedIn name from: {url}")
            
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            # User agent to avoid some basic bot detection
            chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")

            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Set a timeout
            driver.set_page_load_timeout(15)
            driver.get(url)

            # 1. Try to get it from the Page Title
            # Usually: "Name - Position - Company | LinkedIn" or "Name | LinkedIn"
            title = driver.title
            if title and " | LinkedIn" in title:
                # Detect and skip login/sign-up pages
                if any(kw in title for kw in ["Sign Up", "Login", "Join LinkedIn"]):
                    logger.warning(f"LinkedIn redirected to Auth wall: {title}")
                    return None

                name_part = title.split(" | LinkedIn")[0]
                # Further split by dashes or pipes if they exist (Name - Title)
                if " - " in name_part:
                    name = name_part.split(" - ")[0].strip()
                elif " | " in name_part:
                    name = name_part.split(" | ")[0].strip()
                else:
                    name = name_part.strip()
                
                # Basic validation: ensure it's not a generic term and has at least 2 words
                if name and len(name.split()) >= 2 and len(name) < 50:
                    logger.info(f"Extracted name from title: {name}")
                    return name

            # 2. Fallback: Try to find the h1 tag
            try:
                # Common selector for names on public profiles
                wait = WebDriverWait(driver, 5)
                name_element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "h1")))
                name = name_element.text.strip()
                
                if name and "LinkedIn" not in name and len(name.split()) >= 2:
                    logger.info(f"Extracted name from H1: {name}")
                    return name
            except Exception:
                pass

        except Exception as e:
            logger.warning(f"Error scraping LinkedIn: {str(e)}")
        finally:
            if driver:
                driver.quit()

        return None
