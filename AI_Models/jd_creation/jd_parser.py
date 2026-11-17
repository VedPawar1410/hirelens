import re
from .helpers import format_indian_rupees, bold_keywords, get_logo_path, ABOUT_US_TEXT

class JDParser:
    @staticmethod
    def parse_jd_content(jd_content: str, hr_input: dict) -> dict:
        """
        Parse the generated JD content into structured data for the template
        Robust parsing that handles slight variations in LLM output
        """
        experience_level = hr_input.get("experience_level", "").lower()
        is_intern = experience_level == "intern"
        is_fresher = experience_level == "fresher"
        is_experienced = experience_level == "experienced"
        
        stipend_str = ""
        fulltime_str = ""
        
        if is_intern:
            if hr_input.get('stipend_salary'):
                amount = hr_input.get('stipend_salary')
                if isinstance(amount, int):
                    formatted_amount = format_indian_rupees(amount)
                    stipend_str = f"₹{formatted_amount}/Month"
                else:
                    stipend_str = f"{amount} INR/Month"
            
            if hr_input.get('fulltime_offer_salary'):
                amount = hr_input.get('fulltime_offer_salary')
                if isinstance(amount, int):
                    formatted_amount = format_indian_rupees(amount)
                    fulltime_str = f"Based on your performance, we will review your internship and extend a full-time offer. The starting salary for the full-time role will be ₹{formatted_amount}/Month."
                else:
                    fulltime_str = f"Based on your performance, we will review your internship and extend a full-time offer. The starting salary for the full-time role will be {amount} INR/Month."
            else:
                fulltime_str = "Based on your performance, we will review your internship and extend a full-time offer. The salary will be discussed during the conversion process."
        elif is_fresher:
            amount = hr_input.get('stipend_salary') or hr_input.get('fulltime_offer_salary')
            if amount:
                if isinstance(amount, int):
                    formatted_amount = format_indian_rupees(amount)
                    stipend_str = f"₹{formatted_amount}/Month"
                else:
                    stipend_str = f"{amount} INR/Month"
        else:
            if hr_input.get('stipend_salary'):
                amount = hr_input.get('stipend_salary')
                if isinstance(amount, int):
                    formatted_amount = format_indian_rupees(amount)
                    stipend_str = f"₹{formatted_amount}/Month"
                else:
                    stipend_str = f"{amount} INR/Month"
        
        data = {
            "company_name": hr_input.get("company_name", "Acme Corp"),
            "role": hr_input.get("job_title", ""),
            "duration": hr_input.get("duration", ""),
            "location": hr_input.get("location", ""),
            "work_mode": hr_input.get("work_mode", ""),
            "work_hours": hr_input.get("work_hours", ""),
            "experience_level": experience_level,
            "years_of_experience": hr_input.get("years_of_experience", ""),
            "is_intern": is_intern,
            "is_fresher": is_fresher,
            "is_experienced": is_experienced,
            "relevant_experience": hr_input.get("relevant_experience", ""),
            "notice_period": hr_input.get("notice_period", ""),
            "stipend": stipend_str,
            "full_time": fulltime_str,
            "about": "",
            "overview": "",
            "work": [],
            "requirements": [],
            "good_to_have": [],
            "who_can_apply": [],
            "logo_path": get_logo_path()
        }
        
        lines = jd_content.split('\n')
        current_section = None
        current_items = []

        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            lower_line = line.lower()
            
            if any(keyword in lower_line for keyword in ['**about us**', '**about**', 'about us:', 'company information']):
                if current_section and current_items:
                    JDParser._save_section(data, current_section, current_items)
                current_section = 'about'
                current_items = []
            elif any(keyword in lower_line for keyword in ['**role overview**', '**overview**', 'role overview:', 'role description:']):
                if current_section and current_items:
                    JDParser._save_section(data, current_section, current_items)
                current_section = 'overview'
                current_items = []
            elif any(keyword in lower_line for keyword in ['**what you\'ll do**', '**what you do**', '**responsibilities**', 'what you\'ll do:', 'what you do:', 'key responsibilities:']):
                if current_section and current_items:
                    JDParser._save_section(data, current_section, current_items)
                current_section = 'work'
                current_items = []
            elif any(keyword in lower_line for keyword in ['**what you need**', '**requirements**', '**required skills**', 'what you need:', 'required skills:', 'skills required:']):
                if current_section and current_items:
                    JDParser._save_section(data, current_section, current_items)
                current_section = 'requirements'
                current_items = []
            elif any(keyword in lower_line for keyword in ['**great to have**', '**good to have**', '**nice to have**', 'great to have:', 'nice to have:', 'good to have:']):
                if current_section and current_items:
                    JDParser._save_section(data, current_section, current_items)
                current_section = 'good_to_have'
                current_items = []
            elif any(keyword in lower_line for keyword in ['**who can apply**', '**eligibility**', '**ideal candidate**', 'who can apply:', 'eligibility:', 'ideal candidate:']):
                if current_section and current_items:
                    JDParser._save_section(data, current_section, current_items)
                current_section = 'who_can_apply'
                current_items = []
            elif current_section:
                if line.startswith('**') and line.endswith('**'):
                    continue
                if line.endswith(':') and len(line) < 50:
                    continue
                if line.isupper() and len(line) < 50:
                    continue
                
                if line.startswith('•') or line.startswith('-') or line.startswith('*'):
                    raw = line.lstrip('•-* ').strip()
                    # LLM sometimes packs multiple items on one line separated by ' • '
                    # e.g. "Design banners • Collaborate with teams" → split into two items
                    sub_items = [s.strip() for s in raw.split(' • ') if s.strip()]
                    for item in sub_items:
                        if current_section in ['requirements', 'good_to_have']:
                            item = bold_keywords(item)
                        current_items.append(item)
                elif current_section in ['overview', 'about']:
                    if line:
                        data[current_section] += line + ' '
                elif line and len(line) > 3:
                    # Same split for plain (non-bulleted) lines in list sections
                    sub_items = [s.strip() for s in line.split(' • ') if s.strip()]
                    for item in sub_items:
                        if current_section in ['requirements', 'good_to_have']:
                            item = bold_keywords(item)
                        current_items.append(item)
        
        if current_section and current_items:
            JDParser._save_section(data, current_section, current_items)
        
        data['overview'] = data['overview'].strip()
        
        if not data.get('about') or data['about'].strip() == "":
            data['about'] = ABOUT_US_TEXT
        else:
            data['about'] = data['about'].strip()

        if is_experienced:
            overall_exp = str(hr_input.get('years_of_experience', '')).strip()
            relevant_exp = str(hr_input.get('relevant_experience', '')).strip()
            job_title = str(hr_input.get('job_title', '')).strip()
            
            if overall_exp and relevant_exp:
                is_range = "-" in overall_exp or " to " in overall_exp.lower()
                ov_val = overall_exp.lower().replace('years', '').replace('year', '').strip()
                
                rel_part = relevant_exp
                lower_rel = rel_part.lower()
                if "relevant" not in lower_rel:
                    if "hands-on experience" in rel_part.lower():
                        rel_part = re.sub(r'hands-on experience', 'relevant experience', rel_part, flags=re.IGNORECASE)
                    
                    if "years" in rel_part.lower():
                        rel_part = re.sub(r'(\b\d+(?:-\d+)?\+?\s*years?\b)', r'\1 of relevant experience', rel_part, flags=re.IGNORECASE, count=1)
                    
                    if "as a" in rel_part.lower():
                        rel_part = rel_part.replace("as a", "in a").replace("As a", "in a")
                    
                    if "relevant experience" not in rel_part.lower():
                        rel_part = f"{rel_part} of relevant experience"
                
                if rel_part.lower().startswith("minimum"):
                    rel_part = "minimum of " + rel_part[7:].strip()
                
                if "role" not in rel_part.lower() and "position" not in rel_part.lower():
                    rel_part += " role"
                
                if is_range:
                    custom_req = f"Total experience of {ov_val} years, with a {rel_part}."
                else:
                    custom_req = f"Minimum {ov_val} years hands-on experience in {job_title}, with a {rel_part}."

                custom_req = custom_req.replace("..", ".").replace(" ,", ",")
                
                exp_keywords = ['experience of', 'experience required', 'hands-on experience', 'overall experience', 'years of experience']
                data['requirements'] = [item for item in data['requirements'] 
                                        if not any(kw in item.lower() for kw in exp_keywords) 
                                        or len(item) > 200]
                
                data['requirements'].insert(0, bold_keywords(custom_req))

        return data

    @staticmethod
    def _save_section(data: dict, section: str, items: list) -> None:
        """Helper to save parsed section to data dict"""
        if section == 'work':
            data['work'] = items.copy()
        elif section == 'requirements':
            data['requirements'] = items.copy()
        elif section == 'good_to_have':
            data['good_to_have'] = items.copy()
        elif section == 'who_can_apply':
            data['who_can_apply'] = items.copy()