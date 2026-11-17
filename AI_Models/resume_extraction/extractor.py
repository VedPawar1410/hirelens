"""
Text Extraction Module
Handles extraction of text from PDF and DOCX files.
Supports both text-based PDFs and Word documents.
"""

import fitz  # PyMuPDF
from pathlib import Path
from docx import Document
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class TextExtractor:
    """Extract text from various resume file formats."""

    @staticmethod
    def extract_from_pdf(file_path: str) -> Optional[str]:
        """
        Extract text from PDF file using PyMuPDF.
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            Extracted text or None if extraction fails
        """
        try:
            doc = fitz.open(file_path)
            text = ""
            
            # Extract text from all pages
            for page_num in range(len(doc)):
                page = doc[page_num]
                text += page.get_text()
                text += "\n"

            # Extract hyperlinks and append them to the text
            links = []
            for page_num in range(len(doc)):
                page = doc[page_num]
                for link in page.get_links():
                    if "uri" in link:
                        links.append(link["uri"])
            
            if links:
                text += "\n\n--- Extracted Hyperlinks ---\n"
                for link in links:
                    text += f"{link}\n"

            doc.close()
            
            if not text.strip():
                logger.warning(f"PDF extraction resulted in empty text: {file_path}")
                return None
                
            return text.strip()
            
        except Exception as e:
            logger.error(f"Failed to extract text from PDF {file_path}: {str(e)}")
            return None

    @staticmethod
    def extract_from_docx(file_path: str) -> Optional[str]:
        """
        Extract text from DOCX (Word) file.
        
        Args:
            file_path: Path to DOCX file
            
        Returns:
            Extracted text or None if extraction fails
        """
        try:
            doc = Document(file_path)
            text = ""
            
            # Extract text from all paragraphs
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            # Extract text from tables if present
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        text += cell.text + " "
                    text += "\n"
            
            if not text.strip():
                logger.warning(f"DOCX extraction resulted in empty text: {file_path}")
                return None
                
            return text.strip()
            
        except Exception as e:
            logger.error(f"Failed to extract text from DOCX {file_path}: {str(e)}")
            return None

    @staticmethod
    def extract_from_file(file_path: str) -> Optional[str]:
        """
        Auto-detect file type and extract text.
        
        Args:
            file_path: Path to resume file
            
        Returns:
            Extracted text or None if extraction fails
        """
        path = Path(file_path)
        file_ext = path.suffix.lower()
        
        if file_ext == ".pdf":
            return TextExtractor.extract_from_pdf(file_path)
        elif file_ext == ".docx":
            return TextExtractor.extract_from_docx(file_path)
        else:
            logger.error(f"Unsupported file format: {file_ext}")
            return None

    @staticmethod
    def extract_hyperlinks_from_pdf(file_path: str) -> List[str]:
        """
        Extract hyperlinks from a PDF file using PyMuPDF.

        Args:
            file_path: Path to the PDF file

        Returns:
            List of extracted hyperlinks
        """
        try:
            doc = fitz.open(file_path)
            links = []

            for page_num in range(len(doc)):
                page = doc[page_num]
                for link in page.get_links():
                    if "uri" in link:
                        links.append(link["uri"])

            doc.close()
            return links

        except Exception as e:
            logger.error(f"Failed to extract hyperlinks from PDF {file_path}: {str(e)}")
            return []
