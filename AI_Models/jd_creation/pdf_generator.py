from jinja2 import Environment
from weasyprint import HTML
from io import BytesIO
from .jd_parser import JDParser

class PDFGenerator:
    @staticmethod
    def generate_pdf(jd_content: str, hr_input: dict, output_filename: str) -> bool:
        """
        Generate a PDF from the JD content using WeasyPrint and Jinja2
        """
        try:
            pdf_filename = f"{output_filename}.pdf"
            
            # Parse JD content into structured data
            data = JDParser.parse_jd_content(jd_content, hr_input)
            
            # HTML template (inline) - based on debug/template.html
            html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Job Description - {{ role }}</title>
    <style>
        @page {
            size: A4;
            margin: 1in;
        }
        body {
            font-family: 'Aptos', 'Calibri', 'Segoe UI', Arial, sans-serif;
            line-height: 1.2;
            color: #000;
            margin: 0;
            padding: 0;
            font-size: 13pt;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            margin-bottom: 25px;
        }
        .logo {
            width: 120px;
            height: auto;
        }
        .role-section {
            margin-bottom: 15px;
        }
        .role-section p {
            margin: 2px 0;
            font-size: 11pt;
            line-height: 1.2;
        }
        .role-title {
            margin-bottom: 4px !important;
            font-size: 13pt;
        }
        .work-details {
            margin-bottom: 15px;
        }
        .work-details p {
            margin: 2px 0;
            font-size: 11pt;
            line-height: 1.2;
        }
        .full-time-section {
            margin-bottom: 20px;
        }
        .full-time-section p {
            margin: 2px 0;
            font-size: 11pt;
            line-height: 1.3;
        }
        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        h3 {
            margin: 0 0 8px 0;
            color: #000;
            font-size: 12pt;
            font-weight: 700;
            page-break-after: avoid;
            text-transform: none;
            border-bottom: none;
            padding-bottom: 0;
        }
        p {
            font-size: 11pt;
            line-height: 1.3;
            margin: 0 0 10px 0;
        }
        strong, b {
            font-weight: 700;
        }
        ul {
            margin: 0 0 10px 20px;
            padding: 0;
            list-style-type: disc;
        }
        li {
            margin-bottom: 5px;
            font-size: 11pt;
            line-height: 1.3;
            padding-left: 5px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        {% if logo_path %}
        <img src="{{ logo_path }}" class="logo">
        {% else %}
        <h1 style="margin: 0; font-size: 24px;">{{ company_name }}</h1>
        {% endif %}
    </div>

    <!-- Title Section -->
    <div style="margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
        <h2 style="margin: 0; color: #000; font-size: 18pt; text-transform: uppercase;">
            {% if is_intern %}
                Internship Opportunity
            {% elif is_fresher %}
                Entry-Level Position
            {% elif is_experienced %}
                Professional Opportunity
            {% else %}
                Job Opportunity
            {% endif %}
        </h2>
    </div>

    <!-- Role Info -->
    <div class="role-section">
        <p class="role-title"><strong>Role:</strong> <strong>{{ role }}</strong></p>
        
        {% if is_experienced %}
            {% if years_of_experience %}<p><strong>Experience Required:</strong> {{ years_of_experience }} Years</p>{% endif %}
            {% if relevant_experience %}<p><strong>Focus Area:</strong> {{ relevant_experience }}</p>{% endif %}
            {% if notice_period %}<p><strong>Notice Period:</strong> {{ notice_period }}</p>{% endif %}
        {% endif %}

        {% if location %}<p><strong>Location:</strong> {{ location }}</p>{% endif %}
        {% if work_mode %}<p><strong>Work Mode:</strong> {{ work_mode }}</p>{% endif %}
        
        {% if not is_experienced %}
            {% if work_hours %}<p><strong>Work Hours:</strong> {{ work_hours }}</p>{% endif %}
            {% if duration %}<p><strong>Duration:</strong> {{ duration }}</p>{% endif %}
        {% endif %}

        {% if stipend %}
            <p><strong>{% if is_intern %}Monthly Stipend{% else %}Expected Salary{% endif %}:</strong> <strong>{{ stipend }}</strong></p>
        {% endif %}
    </div>

    {% if full_time and is_intern %}
    <div class="full-time-section" style="background-color: #f9f9f9; padding: 10px; border-radius: 5px; border-left: 4px solid #000;">
        <p><strong>Full-Time Opportunity:</strong> {{ full_time }}</p>
    </div>
    {% endif %}

    <!-- About -->
    {% if about %}
    <div class="section" style="margin-top: 20px;">
        <p><strong>About us:</strong> {{ about }}</p>
    </div>
    {% endif %}

    <!-- Role Overview -->
    {% if overview %}
    <div class="section">
        <h3>Role Overview</h3>
        <p>{{ overview }}</p>
    </div>
    {% endif %}

    <!-- Work -->
    {% if work %}
    <div class="section">
        <h3>What You'll Work On</h3>
        <ul>
            {% for item in work %}
            <li>{{ item }}</li>
            {% endfor %}
        </ul>
    </div>
    {% endif %}

    <!-- Requirements -->
    {% if requirements %}
    <div class="section">
        <h3>What You Need</h3>
        <ul>
            {% for item in requirements %}
            <li>{{ item }}</li>
            {% endfor %}
        </ul>
    </div>
    {% endif %}

    <!-- Good to have -->
    {% if good_to_have %}
    <div class="section">
        <h3>Great to Have</h3>
        <ul>
            {% for item in good_to_have %}
            <li>{{ item }}</li>
            {% endfor %}
        </ul>
    </div>
    {% endif %}

    <!-- Who Can Apply -->
    {% if who_can_apply %}
    <div class="section">
        <h3>Who Can Apply</h3>
        <ul>
            {% for item in who_can_apply %}
            <li>{{ item }}</li>
            {% endfor %}
        </ul>
    </div>
    {% endif %}
</body>
</html>
            """
            
            # Render HTML using Jinja2 (autoescape=True escapes user-supplied values
            # to prevent XSS if the HTML intermediate is ever exposed in a browser)
            env = Environment(autoescape=True)
            template = env.from_string(html_template)
            html_out = template.render(data)
            
            # Generate PDF using WeasyPrint
            try:
                HTML(string=html_out, base_url='.').write_pdf(pdf_filename)
                print(f"PDF generated successfully: {pdf_filename}")
                return True
            except Exception as pdf_error:
                print(f"WeasyPrint PDF generation failed: {pdf_error}")
                try:
                    html_filename = f"{output_filename}.html"
                    with open(html_filename, 'w', encoding='utf-8') as f:
                        f.write(html_out)
                    print(f"DEBUG: HTML saved to {html_filename}")
                except:
                    pass
                raise
            
        except Exception as e:
            print(f"Error generating PDF: {e}")
            import traceback
            traceback.print_exc()
            return False

    @staticmethod
    def generate_pdf_bytes(jd_content: str, hr_input: dict) -> bytes:
        """
        Generate a PDF as bytes (in-memory) from JD content
        """
        try:
            # Parse JD content into structured data
            data = JDParser.parse_jd_content(jd_content, hr_input)
            
            # HTML template (inline)
            html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Job Description - {{ role }}</title>
    <style>
        @page {
            size: A4;
            margin: 1in;
        }
        body {
            font-family: 'Aptos', 'Calibri', 'Segoe UI', Arial, sans-serif;
            line-height: 1.2;
            color: #000;
            margin: 0;
            padding: 0;
            font-size: 13pt;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            margin-bottom: 25px;
        }
        .logo {
            width: 120px;
            height: auto;
        }
        .role-section {
            margin-bottom: 15px;
        }
        .role-section p {
            margin: 2px 0;
            font-size: 11pt;
            line-height: 1.2;
        }
        .role-title {
            margin-bottom: 4px !important;
            font-size: 13pt;
        }
        .work-details {
            margin-bottom: 15px;
        }
        .work-details p {
            margin: 2px 0;
            font-size: 11pt;
            line-height: 1.2;
        }
        .full-time-section {
            margin-bottom: 20px;
        }
        .full-time-section p {
            margin: 2px 0;
            font-size: 11pt;
            line-height: 1.3;
        }
        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        h3 {
            margin: 0 0 8px 0;
            color: #000;
            font-size: 12pt;
            font-weight: 700;
            page-break-after: avoid;
            text-transform: none;
            border-bottom: none;
            padding-bottom: 0;
        }
        p {
            font-size: 11pt;
            line-height: 1.3;
            margin: 0 0 10px 0;
        }
        strong, b {
            font-weight: 700;
        }
        ul {
            margin: 0 0 10px 20px;
            padding: 0;
            list-style-type: disc;
        }
        li {
            margin-bottom: 5px;
            font-size: 11pt;
            line-height: 1.3;
            padding-left: 5px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        {% if logo_path %}
        <img src="{{ logo_path }}" class="logo">
        {% else %}
        <h1 style="margin: 0; font-size: 24px;">{{ company_name }}</h1>
        {% endif %}
    </div>

    <!-- Role Info -->
    <div class="role-section">
        <p class="role-title"><strong>Role:</strong> <strong>{{ role }}</strong></p>
        {% if years_of_experience and is_experienced %}<p><strong>Experience:</strong> {{ years_of_experience }} Years of overall experience</p>{% endif %}
        {% if relevant_experience %}<p><strong>Relevant Experience:</strong> {{ relevant_experience }}</p>{% endif %}
        {% if location %}<p><strong>Location:</strong> {{ location }}</p>{% endif %}
        {% if work_mode %}<p><strong>Work mode:</strong> {{ work_mode }}</p>{% endif %}
        {% if notice_period %}<p><strong>Notice Period:</strong> {{ notice_period }}</p>{% endif %}
    </div>

    <div class="work-details">
        {% if work_hours and not is_experienced %}<p><strong>Work Hours:</strong> {{ work_hours }}</p>{% endif %}
        {% if stipend %}<p><strong>{% if is_intern %}Stipend{% else %}Salary{% endif %}:</strong> <strong>{{ stipend }}</strong></p>{% endif %}
    </div>

    {% if full_time and is_intern %}
    <div class="full-time-section">
        <p><strong>Full-Time Offer:</strong> {{ full_time }}</p>
    </div>
    {% endif %}

    <!-- About -->
    {% if about %}
    <div class="section">
        <p><strong>About us:</strong> {{ about }}</p>
    </div>
    {% endif %}

    <!-- Role Overview -->
    {% if overview %}
    <div class="section">
        <h3>Role Overview</h3>
        <p>{{ overview }}</p>
    </div>
    {% endif %}

    <!-- Work -->
    {% if work %}
    <div class="section">
        <h3>What You'll Work On</h3>
        <ul>
            {% for item in work %}
            <li>{{ item }}</li>
            {% endfor %}
        </ul>
    </div>
    {% endif %}

    <!-- Requirements -->
    {% if requirements %}
    <div class="section">
        <h3>What You Need</h3>
        <ul>
            {% for item in requirements %}
            <li>{{ item }}</li>
            {% endfor %}
        </ul>
    </div>
    {% endif %}

    <!-- Good to have -->
    {% if good_to_have %}
    <div class="section">
        <h3>Great to Have</h3>
        <ul>
            {% for item in good_to_have %}
            <li>{{ item }}</li>
            {% endfor %}
        </ul>
    </div>
    {% endif %}

    <!-- Who Can Apply -->
    {% if who_can_apply %}
    <div class="section">
        <h3>Who Can Apply</h3>
        <ul>
            {% for item in who_can_apply %}
            <li>{{ item }}</li>
            {% endfor %}
        </ul>
    </div>
    {% endif %}
</body>
</html>
            """
            
            # Render HTML using Jinja2 (autoescape=True escapes user-supplied values
            # to prevent XSS if the HTML intermediate is ever exposed in a browser)
            env = Environment(autoescape=True)
            template = env.from_string(html_template)
            html_out = template.render(data)
            
            # Generate PDF as bytes using WeasyPrint
            pdf_bytes = BytesIO()
            HTML(string=html_out, base_url='.').write_pdf(pdf_bytes)
            pdf_bytes.seek(0)
            
            print(f"PDF generated successfully as bytes ({len(pdf_bytes.getvalue())} bytes)")
            return pdf_bytes.getvalue()
            
        except Exception as e:
            print(f"Error generating PDF bytes: {e}")
            import traceback
            traceback.print_exc()
            return None

    @staticmethod
    def generate_pdf_from_file(txt_file: str) -> bool:
        """
        Generate a PDF from an existing .txt JD file
        """
        try:
            print(f"\n📖 Reading JD from file: {txt_file}")
            with open(txt_file, 'r', encoding='utf-8') as f:
                jd_content = f.read()
            
            if not jd_content.strip():
                print(f"File is empty: {txt_file}")
                return False
            
            print("✓ JD content loaded successfully")
            
            print("\n" + "="*70)
            print("PROVIDE DETAILS FOR PDF GENERATION")
            print("="*70)
            
            company_name = input("Company Name (default: Acme Corp): ").strip() or "Acme Corp"
            job_title = input("Job Title: ").strip() or "Job Position"
            duration = input("Duration (e.g., '6 Months'): ").strip() or "Not specified"
            location = input("Location: ").strip() or "Not specified"
            work_mode = input("Work Mode (On-site/Remote/Hybrid): ").strip() or "Not specified"
            work_hours = input("Work Hours: ").strip() or "Not specified"
            stipend_salary = input("Stipend/Salary (INR): ").strip() or "0"
            
            hr_input = {
                "company_name": company_name,
                "job_title": job_title,
                "duration": duration,
                "location": location,
                "work_mode": work_mode,
                "work_hours": work_hours,
                "stipend_salary": int(stipend_salary) if stipend_salary.isdigit() else 0,
                "fulltime_offer_salary": None,
                "about_us": "At Acme Corp, we are more than just a team – we are a product development community driven by a shared vision."
            }
            
            base_filename = txt_file.replace('.txt', '')
            output_filename = base_filename
            
            print(f"\n📝 Generating PDF from JD content...")
            return PDFGenerator.generate_pdf(jd_content, hr_input, output_filename)
            
        except FileNotFoundError:
            print(f"File not found: {txt_file}")
            return False
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            return False
