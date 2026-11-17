# ATS Tool — Complete Project Overview

> Written for junior developers. Explains the full system from frontend to backend to AI, how data flows, what tech is used where, and how everything links together.

---

## What Is This Project?

This is an **ATS (Applicant Tracking System)** — a recruitment platform used by HR teams to:
- Write job descriptions (JDs) with AI help
- Upload and parse candidate resumes automatically
- Score candidates against a job description using AI
- Track candidates through a hiring pipeline (like a Kanban board)

Think of it like a smart HR tool that automates the boring parts of recruitment — writing JDs, reading resumes, and ranking candidates — while giving HR and interviewers a clean dashboard to manage everything.

---

## Big Picture: Three Systems Working Together

The project is split into **three separate applications** that talk to each other over HTTP:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   BROWSER (User's Computer)                             │
│   ┌──────────────────────────────────┐                  │
│   │  FRONTEND (React)                │                  │
│   │  Port: 5173                      │                  │
│   │  What users see & click          │                  │
│   └────────────┬─────────────────────┘                  │
│                │  HTTP API calls                        │
└────────────────┼────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  BACKEND (.NET / C#)                                   │
│  Port: 5275                                            │
│  The "brain" — handles auth, data, database            │
│  ┌──────────────────┐  ┌─────────────────────────────┐ │
│  │  SQL Database    │  │  Azure Blob Storage         │ │
│  │  (users, jobs,   │  │  (resumes, PDFs, files)     │ │
│  │   candidates)    │  └─────────────────────────────┘ │
│  └──────────────────┘                                  │
└─────────────────────┬──────────────────────────────────┘
                      │  HTTP API calls
                      ▼
┌────────────────────────────────────────────────────────┐
│  AI MODELS (Python / FastAPI)                          │
│  Port: 8000                                            │
│  The "smart part" — talks to AI to generate & score    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ JD Creation │  │Resume Parser │  │  ATS Scoring  │ │
│  └─────────────┘  └──────────────┘  └───────────────┘ │
│                           │                            │
│                           ▼                            │
│         External AI APIs (OpenRouter / Groq / NVIDIA)  │
└────────────────────────────────────────────────────────┘
```

**Key insight:** The frontend never talks directly to the Python AI server. All AI calls go *through* the .NET backend. The Python server is an internal service (means the Python AI server operates entirely behind the scenes within your private network. It is not exposed to the public internet, making it inaccessible to end-user browsers, mobile apps, or external hackers.).

---

## Part 1 — Frontend (React)

**Location:** `Front-End/`
**URL in dev:** `http://localhost:5173`
**Language:** TypeScript + React 19

### What it does
The frontend is everything the user sees in their browser. It has two main user roles:
- **Recruitment** — HR staff who create JDs, upload resumes, and manage the hiring pipeline
- **Interviewer** — People who review candidates and give feedback

### Key Technologies

| Technology | What it does | Why it's used |
|---|---|---|
| **React 19** | Builds the UI as reusable components | Industry standard for interactive UIs |
| **TypeScript** | Adds type safety to JavaScript | Catches bugs before they happen |
| **Vite** | Builds and serves the app during development | Much faster than older tools like Webpack |
| **TanStack Router** | Handles page navigation (URLs) | The router used in this project instead of React Router |
| **TanStack Query** | Fetches and caches data from the backend API | Smart data-fetching with automatic caching and refetching |
| **Tailwind CSS** | Styles the UI using utility classes | Write styles directly in HTML/JSX without separate CSS files |
| **Lucide React** | Icon library | Clean, consistent icons throughout the app |

https://share.google/aimode/dB1iTlNsrXyrZJidE

### Pages / Routes

```
/login                          → Login page (public)
/recruitment/dashboard          → HR dashboard
/recruitment/jd-creation        → AI-powered JD writing form
/recruitment/jobs               → List of all job folders
/recruitment/jobs/$jobId        → Kanban pipeline for one job
/recruitment/candidates         → All candidates view
/interviewer/dashboard          → Interviewer's dashboard
```

### Folder Structure Pattern

The frontend uses a **feature-sliced** structure. This means code is organized by feature, not by file type:

```
src/
├── features/
│   ├── jd-creation/
│   │   ├── api/         ← Functions that call the backend
│   │   ├── hooks/       ← Custom React hooks for this feature
│   │   ├── components/  ← UI components used only here
│   │   └── pages/       ← The full page component
│   ├── candidates/
│   └── jobs/
├── shared/              ← Shared utilities, types, components
└── components/ui/       ← Reusable UI building blocks (buttons, inputs, etc.)
```

### Important Pattern: API Drafts

The frontend has a translation layer for data coming from the backend:

```
Backend sends:  ApiDraft  (nullable fields, might be missing values)
                    ↓ mapDraft() function converts it
Frontend uses:  JDDraft   (clean, non-nullable, safe to use)
```

This protects the UI from crashing if the backend returns unexpected data.

---

## Part 2 — Backend (.NET / C#)

**Location:** `Back-End/ATStool/`
**URL in dev:** `http://localhost:5275`
**Language:** C# with ASP.NET Core 8

### What it does
The backend is the central coordinator. It:
- Authenticates users (login/logout)
- Stores and retrieves data from the database
- Calls the Python AI server when needed
- Stores files (resumes, PDFs) in Azure cloud storage
- Returns clean, formatted data to the frontend

### Key Technologies

| Technology | What it does |
|---|---|
| **ASP.NET Core 8** | Web framework — handles HTTP requests |
| **Entity Framework Core** | Talks to the database using C# objects (no raw SQL needed) |
| **SQL Server (Azure)** | The main database storing users, jobs, candidates |
| **JWT Authentication** | Secure login tokens sent with every request |
| **Azure Blob Storage** | Cloud file storage for resumes and PDFs |
| **Swagger** | Auto-generates API documentation you can browse in the browser |

### Database Tables (main ones)

```
Users            → HR staff and interviewers (email, password, role)
Jobs             → Job descriptions with title, requirements etc.
JobFolders       → Groups of related jobs
Candidates       → Applicant info (name, email, ATS score, status)
Resumes          → Resume document metadata (actual file is in Azure Blob)
Applications     → Links a candidate to a job
```

### Candidate Status Pipeline

Every candidate moves through these stages in order:

```
Pre-Pipeline → Screening → Phone Screen → Technical Round → HR Round → Offer → Hired
                                                                     ↘ Rejected (at any stage)
```

### Controllers (API Endpoints)

Each controller handles one area of the app:

```
AuthController       → POST /api/auth/login, /api/auth/logout
JobController        → CRUD for job descriptions
JobFolderController  → Manage job folder groups
CandidateController  → Add candidates, update status, view scores
ResumeController     → Upload resumes, fetch resume content
DashboardController  → Statistics and summary data
```

### How the Backend Calls the Python AI Server

The backend has a service called `IExternalApiService` / `ATSScoreService` that knows the Python server's URL and makes HTTP requests to it.

From `appsettings.json`:
```json
"ExternalApi": {
  "BaseUrl": "http://localhost:8000/generate-jd",
  "PdfUrl": "http://localhost:8000/download-pdf",
  "ParsingUrl": "http://localhost:8000"
},
"ATSScoreGeneration": {
  "BaseUrl": "http://localhost:8000"
}
```

The backend acts as a **proxy** — it receives a request from the frontend, adds any extra data (like database info), calls the Python server, then passes the result back to the frontend.

---

## Part 3 — AI Models (Python / FastAPI)

**Location:** `AI_Models/`
**URL in dev:** `http://localhost:8000`
**Language:** Python with FastAPI

This is the part you are working on. It has three separate modules, each solving a different problem.

### Main Entry Point: `api_server.py`

This file starts up the FastAPI web server and registers all the URL endpoints from the three modules. Think of it as the "main switchboard" that routes incoming requests to the right module.

### Key Technologies

| Technology | What it does |
|---|---|
| **FastAPI** | Web framework for Python — like Express.js but for Python |
| **Uvicorn** | Runs the FastAPI server (like Node.js runs JS) |
| **Pydantic** | Validates request/response data shapes |
| **PyMuPDF (fitz)** | Reads text out of PDF files |
| **python-docx** | Reads text out of Word (.docx) files |
| **Spacy** | NLP library — understands human language (used to find names in resumes) |
| **Jinja2** | Template engine — fills variables into HTML templates |
| **WeasyPrint** | Converts HTML into a PDF file |
| **Requests** | Makes HTTP calls to external AI APIs |
| **python-dotenv** | Loads secret API keys from a `.env` file |

---

### Module 1: JD Creation (`jd_creation/`)

**Purpose:** Takes a form filled in by HR and generates a professional, structured job description using an AI language model.

#### Files
```
jd_creation/
├── jd_generator.py       ← Calls the AI to write the JD
├── pdf_generator.py      ← Converts the JD into a downloadable PDF
├── jd_parser.py          ← Breaks the JD text into sections
├── helpers.py            ← Small utility functions
└── jd_prompt_template.md ← The instruction template sent to the AI
```

#### How It Works (Step by Step)

```
1. HR fills in a form (job title, location, salary, experience level, role description)
       ↓
2. Frontend sends this to Backend API
       ↓
3. Backend calls Python: POST http://localhost:8000/generate-jd
       ↓
4. jd_generator.py builds a prompt using jd_prompt_template.md
   (Example: "Write a JD for a Senior Engineer, experienced level, 
    salary ₹5 LPA, in Hyderabad, Remote...")
       ↓
5. Sends prompt to OpenRouter or Groq AI API
       ↓
6. AI returns professional JD text
       ↓
7. jd_parser.py splits it into sections (About Us, Responsibilities, etc.)
       ↓
8. Returns structured JD to backend → backend sends to frontend
       ↓
9. HR can read/edit the JD in the browser
       ↓
10. HR clicks "Download PDF" → Backend calls POST /download-pdf
        ↓
11. pdf_generator.py fills JD text into an HTML template, WeasyPrint converts to PDF
        ↓
12. PDF bytes sent back → user's browser downloads it
```

#### AI Provider Fallback

The system tries AI providers in order. If one fails, it tries the next:

```
Primary: OpenRouter (free models)
    ↓ (if fails)
Fallback: Groq (llama-3.3-70b-versatile)
```

#### API Endpoints in This Module

| Endpoint | Method | What It Does |
|---|---|---|
| `/health` | GET | Simple "is the server alive?" check |
| `/generate-jd` | POST | Generate JD text from HR form data |
| `/generate-jd-and-pdf` | POST | Generate JD + return PDF in one step |
| `/download-pdf` | POST | Convert existing (edited) JD text to PDF |

---

### Module 2: Resume Extraction (`resume_extraction/`)

**Purpose:** Takes uploaded resume files (PDF or Word) and extracts the candidate's contact information and full text content automatically.

#### Files
```
resume_extraction/
├── processor.py   ← Handles multiple resumes at once (batch processing)
├── extractor.py   ← Pulls raw text out of PDF/DOCX files
├── parser.py      ← Finds name, email, phone, LinkedIn, GitHub in the text
└── scraper.py     ← Helper utilities
```

#### How It Works (Step by Step)

```
1. HR uploads 1-100 resumes through the frontend
       ↓
2. Frontend sends files to Backend API
       ↓
3. Backend calls Python: POST http://localhost:8000/extract-resumes
       ↓
4. processor.py receives all files
       ↓
5. For EACH file (running up to 4 at the same time in parallel):
   
   a. extractor.py checks if it's PDF or DOCX
      - PDF: uses PyMuPDF to read page by page
      - DOCX: uses python-docx to read paragraphs
   
   b. parser.py searches the extracted text for:
      - Name: Spacy NLP finds person names near top of resume
      - Email: Regex finds anything matching name@domain.com
      - Phone: Regex finds phone number patterns (+91-9876543210 etc.)
      - LinkedIn: Finds linkedin.com/in/* URLs
      - GitHub: Finds github.com/* URLs
       ↓
6. Returns results in same order as upload (even if processed out of order)
       ↓
7. Backend saves candidate info to database
       ↓
8. Frontend shows a list of parsed candidates ready to be added to the pipeline
```

#### Example Output for One Resume

```json
{
  "index": 0,
  "CandidateID": "a7f3c2d1-...",
  "status": "success",
  "name": "Priya Sharma",
  "email": "priya.sharma@gmail.com",
  "phone": "+91-9876543210",
  "linkedin": "https://linkedin.com/in/priyasharma",
  "github": "https://github.com/priyasharma",
  "content": "Priya Sharma\nSoftware Engineer...(full resume text)",
  "error": null
}
```

#### Performance

| Resume Count | Time Taken |
|---|---|
| 10 resumes | ~2-3 seconds |
| 100 resumes | ~15-20 seconds |
| 1000 resumes | ~2-3 minutes |

The 4-worker parallel processing is why it's fast — 4 resumes processed at the same time instead of one after another.

---

### Module 3: ATS Scoring (`ats_scoring/`)

**Purpose:** Compares a candidate's resume against a job description and gives a score from 0–100 showing how good a match they are.

#### Files
```
ats_scoring/
├── analyzer.py   ← Calls the AI to generate the score, handles multiple AI providers
├── scorer.py     ← Validates request/response data
├── processor.py  ← Handles scoring multiple candidates at once (batch)
└── models.py     ← Data shapes (Pydantic models for request/response)
```

#### How It Works (Step by Step)

```
1. HR opens a job's candidate list and clicks "Generate ATS Scores"
       ↓
2. Frontend calls Backend API
       ↓
3. Backend fetches: job description text + all candidate resume texts from database
       ↓
4. Backend calls Python: POST http://localhost:8000/score-candidates
   (sends JD text + list of {candidateId, resumeContent})
       ↓
5. processor.py processes up to 4 candidates at the same time (parallel)
       ↓
6. For EACH candidate, analyzer.py:
   a. Builds a prompt: "Given this JD: [JD text]\nGiven this resume: [resume text]\nScore match 0-100:"
   b. Sends to AI provider (NVIDIA → Groq → OpenRouter in order of preference)
   c. Validates the response is a number between 0-100
   d. Returns the score
       ↓
7. All scores collected and returned to backend
       ↓
8. Backend saves scores to database (Candidate.ATSScore column)
       ↓
9. Frontend shows scores next to each candidate, sorted by score
```

#### Score Meaning

| Score Range | What It Means |
|---|---|
| 0–20 | Poor fit — major skill gaps |
| 21–40 | Below average — significant gaps |
| 41–60 | Average fit — some gaps but qualified |
| 61–80 | Good fit — well qualified |
| 81–100 | Excellent fit — near perfect match |

#### AI Provider Fallback Chain (3 levels)

```
1st choice: NVIDIA (meta/llama-3.2-11b-vision-instruct)
   Has rate limiting: max 40 requests per 60 seconds
        ↓ (if fails or rate limited)
2nd choice: Groq (llama-3.3-70b-versatile)
        ↓ (if fails)
3rd choice: OpenRouter (free tier models)
```

This 3-tier fallback means even if one AI provider is down or too slow, scoring still works.

---

## Complete Data Flow Examples

### Example 1: Creating a Job Description

```
[HR types job info in form]
          ↓
[Frontend: POST /api/jd/generate with form data]
          ↓
[Backend: receives request, checks JWT auth]
          ↓
[Backend: POST http://localhost:8000/generate-jd]
          ↓
[Python: builds prompt from template + form data]
          ↓
[Python: POST to OpenRouter/Groq API with prompt]
          ↓
[AI: returns JD text]
          ↓
[Python: structures JD into sections, returns to backend]
          ↓
[Backend: saves JD to database, returns to frontend]
          ↓
[Frontend: displays JD for HR to review/edit]
          ↓
[HR edits JD, clicks Download PDF]
          ↓
[Frontend: POST /api/jd/download-pdf with edited JD]
          ↓
[Backend: POST http://localhost:8000/download-pdf]
          ↓
[Python: renders JD into HTML template with Jinja2]
          ↓
[Python: WeasyPrint converts HTML → PDF bytes]
          ↓
[Python → Backend → Frontend: PDF bytes]
          ↓
[Browser: file download triggered]
```

### Example 2: Uploading Resumes

```
[HR selects 20 PDF files and clicks Upload]
          ↓
[Frontend: POST /api/resumes/upload (multipart form)]
          ↓
[Backend: receives files, saves raw files to Azure Blob Storage]
          ↓
[Backend: POST http://localhost:8000/extract-resumes (sends files)]
          ↓
[Python: 4 workers process 4 resumes at a time]
  Worker 1: resume_1.pdf → extract text → parse contacts
  Worker 2: resume_2.pdf → extract text → parse contacts
  Worker 3: resume_3.pdf → extract text → parse contacts
  Worker 4: resume_4.pdf → extract text → parse contacts
  (next batch starts when workers free up)
          ↓
[Python: returns list of {name, email, phone, linkedin, github, content}]
          ↓
[Backend: saves each candidate to database]
          ↓
[Frontend: shows list of parsed candidates]
[HR reviews and confirms which to add to pipeline]
```

### Example 3: Scoring Candidates

```
[HR opens job page, clicks "Score All Candidates"]
          ↓
[Frontend: POST /api/candidates/score-all?jobId=123]
          ↓
[Backend: fetches JD text + all candidate resume texts from database]
          ↓
[Backend: POST http://localhost:8000/score-candidates]
  Body: { jdContent: "...", candidates: [{id, resumeContent}, ...] }
          ↓
[Python: splits candidates into batches of 4]
[Parallel scoring using 3-provider fallback AI chain]
          ↓
[Python: returns [{candidateId, atsScore: 78}, ...]]
          ↓
[Backend: updates each Candidate.ATSScore in database]
          ↓
[Frontend: re-fetches candidates, now sorted by score]
[HR sees ranked list with scores beside each name]
```

---

## Authentication Flow

```
[User visits /login, enters email + password]
          ↓
[Frontend: POST /api/auth/login]
          ↓
[Backend: checks email/password against database]
[Backend: generates JWT token (signed with secret key)]
[Backend: sends JWT in HttpOnly cookie]
          ↓
[Browser: stores cookie automatically (not accessible by JavaScript)]
          ↓
[Every future request: browser sends cookie automatically]
[Backend: reads cookie, verifies JWT, knows who the user is]
          ↓
[Backend: checks user's role (Admin / Recruitment / Interviewer)]
[If wrong role for that endpoint: returns 403 Forbidden]
```

**Why HttpOnly cookies?** Regular cookies can be stolen by malicious JavaScript (XSS attacks). HttpOnly cookies can't be read by JavaScript at all — only sent with HTTP requests. More secure.

---

## Environment Configuration

Each part of the app has its own config file with secrets and settings:

### Python (`AI_Models/.env`)
```env
# Which AI to use for JD generation
DEFAULT_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-...
GROQ_API_KEY=gsk_...

# Which AI to use for ATS scoring  
NVIDIA_API_KEY=nvapi-...
NVIDIA_RATE_LIMIT=40
```

### Backend (`Back-End/ATStool/appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...azure.com;Database=ats_db;..."
  },
  "Jwt": {
    "Key": "super-secret-signing-key",
    "Issuer": "ats-tool",
    "Audience": "ats-users"
  },
  "ExternalApi": {
    "BaseUrl": "http://localhost:8000"
  },
  "AzureBlob": {
    "ConnectionString": "DefaultEndpointsProtocol=https;..."
  }
}
```

### Frontend (`Front-End/.env.local`)
```env
VITE_API_BASE_URL=http://localhost:5275
```

**Important:** Never commit `.env` files to git. They contain secrets. They are listed in `.gitignore`.

---

## Running the Project Locally

You need three terminals running at the same time:

**Terminal 1 — Python AI Server:**
```bash
cd AI_Models
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — .NET Backend:**
```bash
cd Back-End/ATStool
dotnet run
# OR open in Visual Studio and press F5
```

**Terminal 3 — React Frontend:**
```bash
cd Front-End
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## Tech Stack Summary Table

| Layer | Technology | Language | Port | Purpose |
|---|---|---|---|---|
| Frontend UI | React 19 + Vite | TypeScript | 5173 | What users see |
| Frontend Routing | TanStack Router | TypeScript | — | URL navigation |
| Frontend Data | TanStack Query | TypeScript | — | API calls + caching |
| Frontend Style | Tailwind CSS v4 | CSS | — | Visual styling |
| Backend API | ASP.NET Core 8 | C# | 5275 | Business logic + auth |
| Database | SQL Server (Azure) | SQL | — | Store all data |
| File Storage | Azure Blob Storage | — | — | Store files/PDFs |
| AI Server | FastAPI + Uvicorn | Python | 8000 | AI processing |
| JD Generation AI | OpenRouter / Groq | — | — | Write job descriptions |
| ATS Scoring AI | NVIDIA / Groq / OpenRouter | — | — | Score candidates |
| PDF Extraction | PyMuPDF + python-docx | Python | — | Read resume files |
| NLP Parsing | Spacy | Python | — | Find names in text |
| PDF Generation | Jinja2 + WeasyPrint | Python | — | Create PDF downloads |

---

## Key Concepts for a Junior Dev

### What is an API?
When one program needs data from another, it makes an HTTP request — just like your browser loading a webpage, but between programs. A REST API is a set of URLs a server exposes so other programs can call it.

### What is FastAPI?
FastAPI is a Python web framework. You write Python functions and decorate them with `@app.get("/url")` or `@app.post("/url")`. FastAPI handles everything else — routing, validation, error responses.

### What is a JWT?
JSON Web Token. It's a string (looks like `eyJhbG...`) that proves who you are. The backend creates it after login and signs it with a secret key. With every request, your browser sends this token, and the backend verifies the signature to confirm it hasn't been tampered with.

### What is async/parallel processing?
When the Python server gets 20 resumes, processing them one-at-a-time would take 20x as long. Instead, it uses a `ThreadPoolExecutor` to process 4 at a time simultaneously. This is called parallel processing. When resume 1, 2, 3, 4 finish, it starts 5, 6, 7, 8 — until all are done.

### What is a fallback chain?
If the primary AI provider (NVIDIA) is down or too slow, the code automatically tries the next one (Groq), then the next (OpenRouter). This makes the system resilient — one AI being down doesn't break everything.

### What is Pydantic?
Pydantic is a Python library for data validation. You define a class like `class ScoringRequest(BaseModel): candidateId: str; resumeContent: str` and FastAPI automatically validates that incoming JSON has the right fields and types. Wrong data? It sends a 422 error automatically.

---

## Where Your Work Fits (AI_Models/)

Since you are working on the `AI_Models/` part, here's what to know:

1. **Your code runs as a standalone Python server** — the backend just calls it over HTTP
2. **`api_server.py` is the entry point** — all endpoints are registered here
3. **Each module is independent** — changes to `ats_scoring/` don't affect `jd_creation/`
4. **AI calls happen here** — API keys for OpenRouter, Groq, NVIDIA are all configured in `.env`
5. **The backend treats this as a black box** — it sends a request, expects a response in a specific JSON format

When you want to test your changes without the full backend running, you can call the Python API directly using tools like Postman or `curl`:
```bash
curl -X POST http://localhost:8000/score-candidate \
  -H "Content-Type: application/json" \
  -d '{"candidateId": "test-123", "resumeContent": "John Doe, Python developer...", "jdContent": "We need a Python developer..."}'
```

---

*Document generated 2026-05-15. For the most current architecture details, read the source files directly.*
