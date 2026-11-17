#JD Generator using LLM (OpenRouter).This module generates Job Descriptions based on HR form inputs
 
import os
import json
import llm_client
import re
from dotenv import load_dotenv
from typing import Dict, Any
 
from .helpers import enforce_about_us, get_logo_path, format_indian_rupees, bold_keywords
from .jd_parser import JDParser
from .pdf_generator import PDFGenerator
 
# Load environment variables
load_dotenv(override=True)
 
class JDGenerator:
    ABOUT_US_TEXT = "At Acme Corp, we are more than just a team – we are a product development community driven by a shared vision. Our values shape who we are, what we do, and how we interact with our peers and our customers. We're not just seeking any regular engineer; we want individuals who identify with our core values and are passionate about software development."
 
    def __init__(self):
        # No API key is checked here: PDF rendering needs no LLM. generate_jd() goes
        # through llm_client (Groq -> Gemini) and fails clearly if no provider is configured.
        pass

    def load_prompt_template(self, template_path: str = "jd_prompt_template.md") -> str:
        """Load the JD prompt template from file"""
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            print(f"Warning: {template_path} not found. Using inline template.")
            return self._get_default_template()
   
    def _get_default_template(self) -> str:
        """Fallback template if file not found"""
        return """You are an expert HR and recruitment specialist. Generate a professional Job Description based on the provided information following the exact format shown."""
   
    def generate_jd(self, hr_input: Dict[str, Any]) -> str:
        """
        Generate a JD from HR form input
       
        Args:
            hr_input: Dictionary containing:
                - job_title, experience_level, location, duration, work_mode, work_hours
                - years_of_experience, stipend_salary, fulltime_offer_salary
                - role_description (free text description for LLM to analyze)
                - company_name, about_us
       
        Returns:
            Generated JD as string
        """
        # Load the prompt template
        template = self.load_prompt_template()
       
        # Create the system prompt
        system_prompt = template
       
        # Interpret data based on experience level
        experience_level = hr_input.get('experience_level', '').lower() if hr_input.get('experience_level') else ''
        is_intern = experience_level == 'intern'
        is_fresher = experience_level == 'fresher'
        is_experienced = experience_level == 'experienced'
       
        # Interpret compensation fields based on role type
        # (Backend sends generic fields, we interpret them contextually)
        compensation_info = ""
        if is_intern:
            if hr_input.get('stipend_salary'):
                compensation_info += f"- Monthly Stipend: ₹{hr_input.get('stipend_salary')} INR/Month\n"
            if hr_input.get('fulltime_offer_salary'):
                compensation_info += f"- Full-Time Offer Salary (upon successful completion): ₹{hr_input.get('fulltime_offer_salary')} INR/Month\n"
        else:
            # For fresher and experienced, stipend_salary is interpreted as salary
            if hr_input.get('stipend_salary'):
                compensation_info += f"- Monthly Salary: ₹{hr_input.get('stipend_salary')} INR/Month\n"
       
        # Build job details section
        job_details = []
        if hr_input.get('duration'):
            job_details.append(f"- Duration: {hr_input.get('duration')}")
        if hr_input.get('location'):
            job_details.append(f"- Location: {hr_input.get('location')}")
        if hr_input.get('work_mode'):
            job_details.append(f"- Work Mode: {hr_input.get('work_mode')}")
        if hr_input.get('work_hours'):
            job_details.append(f"- Work Hours: {hr_input.get('work_hours')}")
       
        job_details_section = "\n".join(job_details) if job_details else "- Details to be discussed"
       
        # Build experience requirement section based on role type
        experience_requirement = ""
        if is_intern:
            experience_requirement = "- This is an internship opportunity (no prior experience required)\n- Ideal candidates: Students, recent graduates, career changers eager to learn"
        elif is_fresher:
            experience_requirement = "- This is a fresher/entry-level position (no prior professional experience required)\n- Ideal candidates: Recent graduates with academic knowledge ready to apply in a professional setting"
        elif is_experienced:
            if hr_input.get('years_of_experience'):
                # Format requested by user for experienced roles
                # Strip 'years' from input if present to avoid "years years"
                exp_val = str(hr_input.get('years_of_experience')).lower().replace('years', '').replace('year', '').strip()
                experience_requirement = f"- Minimum {exp_val} years of hands-on experience in {hr_input.get('job_title')}, with a proven track record of delivering impactful solutions."
            else:
                experience_requirement = "- Professional experience required\n- Ideal candidates: Mid to senior-level professionals"
        else:
            experience_requirement = "- Experience level to be determined based on role requirements"
       
        # Build role-specific instruction for LLM
        role_instruction = ""
        if is_intern:
            role_instruction = """
**ROLE TYPE: INTERNSHIP**
- Emphasize learning opportunities, mentorship, hands-on experience, and career growth potential
- Include information about skill development and knowledge transfer
- Mention the opportunity for full-time conversion upon successful performance
- Language should be encouraging and welcoming to students/recent graduates
- Tone: Educational, supportive, growth-oriented"""
        elif is_fresher:
            role_instruction = """
**ROLE TYPE: FRESHER/ENTRY-LEVEL**
- Emphasize career launch, practical application of academic knowledge, and growth potential
- Focus on the opportunity to build professional skills and experience
- Language should be encouraging to recent graduates
- Highlight mentorship and learning culture
- Tone: Professional, growth-focused, welcoming"""
        elif is_experienced:
            role_instruction = """
**ROLE TYPE: EXPERIENCED**
- Emphasize technical depth, leadership opportunities, and impact on strategic initiatives
- Focus on career advancement and expertise application
- Highlight challenging projects and professional growth
- Language should appeal to senior professionals
- Tone: Professional, achievement-focused, strategic"""
        relevant_exp = f"Relevant Experience: {hr_input.get('relevant_experience')}\n" if hr_input.get('relevant_experience') else ""
        notice_period = f"Notice Period: {hr_input.get('notice_period')}\n" if hr_input.get('notice_period') else ""
        user_prompt = f"""Generate a professional, well-structured Job Description using the EXACT structure below. Follow this format precisely:
 
**ROLE TYPE:** {experience_level.upper() if experience_level else 'NOT SPECIFIED'}
{role_instruction}
 
**AVAILABLE INFORMATION:**
Role Title: {hr_input.get('job_title')}
Location: {hr_input.get('location') or 'To be discussed'}
Company: {hr_input.get('company_name', 'Acme Corp')}
 
Job Details:
{job_details_section}
{relevant_exp}{notice_period}
Compensation:
{compensation_info if compensation_info.strip() else "- Compensation details to be discussed"}
 
Experience Requirement:
{experience_requirement}
 
Company Information:
{hr_input.get('about_us', '')}
 
Role Details & Responsibilities:
{hr_input.get('role_info', '')}
 
---
 
**GENERATE JD IN EXACTLY THIS STRUCTURE** (use these exact section headers):
 
**About Us**
[2-3 sentences about the company]
 
**Role Overview**
[2-3 sentences about the role, its importance, and what the candidate will work on]
 
**What You'll Do**
[5-8 key responsibilities as bullet points, each starting with •]
 
**What You Need**
• {experience_requirement.lstrip('- ')}
[Required skills, experience, and qualifications as bullet points, each starting with •]
{f'[For {experience_level}: Emphasize {experience_level}-appropriate requirements]' if experience_level else ''}
 
**Great to Have**
[Nice-to-have skills and qualifications as bullet points, each starting with •]
 
**Who Can Apply**
[Target candidate profile, educational background, and ideal qualities as bullet points, each starting with •]
{f"[Include: Potential for full-time conversion upon successful completion]" if is_intern else ""}
 
---
 
**IMPORTANT INSTRUCTIONS:**
1. Use EXACTLY the section headers shown above (no variations)
2. Use bullet points (•) for all list items
3. For {experience_level.upper() if experience_level else 'the given'} roles, focus on: {role_instruction.split('- ')[1] if '- ' in role_instruction else ''}
4. Keep descriptions concise and professional
5. Generate ONLY the JD content (no preamble or explanations)
6. Maintain consistent formatting throughout"""
       
        jd = llm_client.chat(
            [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
            max_tokens=4096,
            temperature=0.7,
        )
        if not jd:
            raise RuntimeError("JD generation failed: no LLM provider returned content (check GROQ_API_KEY / GEMINI_API_KEY)")
        # Post-process to enforce fixed "About Us" section
        return self._enforce_about_us(jd)

    def _enforce_about_us(self, jd_content: str) -> str:
        return enforce_about_us(jd_content)
       
    def get_logo_path(self) -> str:
        return get_logo_path()
       
    def format_indian_rupees(self, amount: int) -> str:
        return format_indian_rupees(amount)
       
    def _bold_keywords(self, text: str) -> str:
        return bold_keywords(text)
       
    def parse_jd_content(self, jd_content: str, hr_input: dict) -> dict:
        return JDParser.parse_jd_content(jd_content, hr_input)
       
    def _save_section(self, data: dict, section: str, items: list) -> None:
        JDParser._save_section(data, section, items)
       
    def generate_pdf(self, jd_content: str, hr_input: dict, output_filename: str) -> bool:
        return PDFGenerator.generate_pdf(jd_content, hr_input, output_filename)
       
    def generate_pdf_bytes(self, jd_content: str, hr_input: dict) -> bytes:
        return PDFGenerator.generate_pdf_bytes(jd_content, hr_input)
       
    def generate_pdf_from_file(self, txt_file: str) -> bool:
        return PDFGenerator.generate_pdf_from_file(txt_file)
 
    def save_jd(self, jd_content: str, filename: str) -> None:
        """Save the generated JD to a text file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(jd_content)
            print(f"JD saved to {filename}")
        except Exception as e:
            print(f"Error saving JD to file: {e}")
 
def main():
    """Example usage"""
    # Sample HR input (based on your AI/ML Intern JD)
    sample_input = {
        "company_name": "Acme Corp",
        "experience_level": "Intern",
        "job_title": "AI/ML Intern – Agentic AI (Autonomous Agents)",
        "department": "AI/ML",
        "role_specialization": "Autonomous Agents",
        "duration": "6 Months",
        "location": "Raidurg Main Road, Hyderabad",
        "work_mode": "On-site",
        "work_hours": "11:00 AM to 8:00 PM",
        "stipend_salary": 35000,
        "fulltime_offer_salary": 50000,
        "currency": "INR",
        "role_overview": "We're looking for driven interns who want to work on cutting-edge Agentic AI systems—autonomous agents that can reason, plan, and act independently. If you're passionate about AI beyond the basics and want hands-on exposure to real agent workflows, this role is built for you.",
        "key_responsibilities": "Designing and experimenting with autonomous AI agents\nBuilding agent workflows using LangChain, OpenAI tools, RAG pipelines, etc.\nIntegrating APIs, vector databases, and automation tools\nRunning experiments, tracking behavior, and refining performance\nContributing to internal POCs and innovation projects",
        "key_technologies": "LangChain, OpenAI, RAG, Vector Databases, Python, Autonomous Agents",
        "required_skills": "Strong Python skills (or solid programming in any language)\nUnderstanding of ML fundamentals & embeddings\nFamiliarity with LLM-based apps, LangChain, or RAG (or willingness to learn fast)\nBasic knowledge of GitHub, SQL, and cloud platforms",
        "nice_to_have_skills": "Experience with autonomous agents (CrewAI, AutoGen, Swarm libraries)\nExposure to vector databases\nKnowledge of reinforcement learning",
        "who_can_apply": "Final-year students or recent graduates in Computer Science, Artificial Intelligence, Data Science, or related disciplines. Candidates with hands-on coursework or project experience in AI/ML, especially on Agentic AI. Individuals who are self-driven, collaborative, and passionate about applying technology to real-world impact.",
        "about_us": "At Acme Corp, we are more than just a team – we are a product development community driven by a shared vision. Our values shape who we are, what we do, and how we interact with our peers and our customers. We're not just seeking any regular engineer; we want individuals who identify with our core values and are passionate about software development."
    }
   
    try:
        # Initialize generator
        generator = JDGenerator()
        print("OK: JD Generator initialized successfully")
        print("Using providers: " + ", ".join(p["name"] for p in llm_client.configured_providers()))
        print("-" * 60)
       
        # Generate JD
        print("Generating JD...")
        jd = generator.generate_jd(sample_input)
       
        # Save to file
        generator.save_jd(jd, "sample_generated_jd.txt")
       
        # Output summary
        print("\n" + "=" * 60)
        print("GENERATED JD PREVIEW:")
        print("=" * 60)
        # Just show the first 200 characters to avoid massive console output
        print(jd[:500] + "..." if len(jd) > 500 else jd)
        print("=" * 60)
        print(f"Full JD available in sample_generated_jd.txt")
       
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
 
 
if __name__ == "__main__":
    main()