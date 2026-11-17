# HireLens

An open-source Applicant Tracking System. Two portals — **Recruitment** and **Interviewer** — covering the full hiring pipeline from job description creation to candidate selection.

---

## Overview

HireLens streamlines the recruiting workflow: recruiters create AI-generated job descriptions, configure per-job interview rounds, upload resume folders, and manage candidates through a pipeline with automated ATS match scoring. Interviewers get a separate portal to view assigned JDs, schedule and reschedule interviews, skip rounds, and submit feedback. Every interview triggers an automated email notification.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript (strict), Vite, Tailwind CSS 4 |
| Routing | TanStack Router |
| Data Fetching | TanStack Query v5 |
| UI | Lucide icons, Sora font |
| Backend | .NET 10, SQL Server (Azure) |
| AI / Scoring | Python 3, FastAPI (`localhost:8000`) |
| Storage | Azure Blob Storage |
| Email | SMTP with HTML email templates |
| Code Quality | SonarQube / SonarLint (TS strict rules enforced) |

---

## Features

### Recruitment Portal

#### Job Description (JD) Creation
- **AI-generated JDs** — fill structured fields, submit to LLM, get a live preview
- **Status machine:** `draft` → `assigned` → `returned` → `finalized`
  - `draft` — invisible to interviewers; recruiters can Save, Edit, or Delete (with confirmation step)
  - `assigned` — recruiter assigns title + ≥1 interviewer; becomes visible in interviewer portal
  - `returned` — interviewer fills role description and submits back
  - `finalized` — recruiter approves the LLM preview; PDF downloadable
- **PDF download** — ref-counted blob URL cache with deferred revoke; PDF magic-bytes validated before storage and serving
- **Configure Interview Rounds** — per-job configurable rounds (name + type) via `ConfigureRoundsModal` from the job folder header; seeded with 4 defaults

#### Resume & Candidate Management
- **Bulk resume upload** — folder drag-and-drop, duplicate detection via file hashing; requires `jobId`
- **ATS Scoring** — queue-based background pipeline (`Channel<AtsScoreJob>` + `AtsScoreWorker`); score updates pushed in real time over SSE (`GET /api/candidates/stream?jobId=`)
  - `null` = unscored · `-1` = pending (shown as `…`) · negative other = failed · `0–100` = match %
- **6-stage pipeline:** `under_review` → `filtered` → `shortlisted` → `interviewing` → `selected` / `rejected`
  - Kanban board and virtualized list view; prev/next arrows iterate candidates within the same stage
  - "View full profile" preserves stage context; back button restores exact kanban column
- **Interviewer assignment** — assign interviewers to a candidate directly from the candidate detail page

#### Interview Scheduling & Management
- **Schedule round** — `InterviewScheduleModal` fetches job-specific rounds from the draft, filters already-booked rounds, sends confirmation email on success
- **Reschedule** — `RescheduleInterviewModal` patches time/date and re-sends notification email
- **Skip / Undo skip** — skip a round per candidate inline from `ScheduleInterviewCard`; skipped rounds stored as `SkippedRound { Round, SkippedBy, SkippedAt }` in JSON column on `Application`
- **Stage gate** — "Next Stage →" (to `selected`) only enables when all configured rounds are `Completed` or skipped (`canMoveToSelected`)
- **Round snapshot** — `Interview.RoundName` stored at scheduling time; always displayed from the record, never re-derived from a label map

#### Candidate Notes
- Recruiters and interviewers can add/delete free-text notes on any candidate
- `NoteComposer` shared component; notes stored in `CandidateNote { noteId, authorId, authorName, text, createdAt }`
- API: `GET /api/candidates/:id/notes` · `POST /api/candidates/:id/notes` · `DELETE /api/candidates/:id/notes/:noteId`

#### Dashboard
- Pipeline funnel, application volume chart (7d / 30d / 90d), recent job folders
- **Attention items** — surfaces upcoming interviews with deep-link (`nextCandidateId` + `nextJobId`) and upcoming-deadline flags
- All timestamps displayed in local timezone

### Interviewer Portal
- **Dashboard** — upcoming interviews, personal stats, recent activity, prep tips
- **JD View** — read assigned job descriptions; fill role description and submit back to recruiter
- **My Candidates** — filter counts reflect active search query
- **Interview Feedback** — submit ratings, recommendations, and notes per round

---

## API Surface

### Auth
`POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/interviewers`

### Drafts (`/api/drafts`)
`GET ?createdBy=|assignedTo=` · `POST` · `PATCH /:id` · `PATCH /:id/assign` · `PATCH /:id/role-description` · `PATCH /:id/submit` · `POST /:id/generate` · `POST /:id/finalize` · `GET /:id/pdf` · `DELETE /:id` · `PUT /:id/interview-rounds`

### Jobs (`/api/jobs`)
`GET ?page=&limit=` · `GET /:id` · `PATCH /:id/status`

### Candidates (`/api/candidates`)
`GET ?status=&search=&page=&limit=&sortBy=&sortDir=&minScore=` · `GET /:id?jobId=` · `GET /stream?jobId=` (SSE) · `GET /counts` · `GET /job-stage-counts?jobId=` · `PATCH /:id/stage?jobId=` · `PATCH /:id/prev-stage?jobId=` · `PATCH /:id/shortlist?jobId=` · `PATCH /:id/reject?jobId=` · `GET /:id/notes` · `POST /:id/notes` · `DELETE /:id/notes/:noteId`

### Resumes
`POST /api/resumes/upload` (multipart: files + jobId) · `GET /api/resumes?jobId=`

### Dashboard (`/api/dashboard`)
`GET /stats` · `GET /application-volume?period=7d|30d|90d` · `GET /recent-job-folders?limit=3` · `GET /pipeline-funnel` · `GET /attention-items`

### Interviews (`/api/interviews`)
`POST /schedule-round` · `PATCH /:id/reschedule` · `PATCH /:id/cancel` · `PATCH /:id/no-show` · `POST /skip-round` · `POST /unskip-round` · `GET /upcoming?hours=24` · `GET /interviewer/:id`

---

## Project Structure

```
hirelens/
├── Front-End/                    # React + Vite app
│   └── src/
│       ├── features/
│       │   ├── recruiter/        # candidates, dashboard, jd-creation, job-folders
│       │   └── interviewer/      # dashboard, jd-creation, candidates
│       └── shared/
│           ├── components/
│           │   ├── ui/           # BezelCard, StatCard, GlowOrb, NoteComposer,
│           │   │                 #   MatchBadge, PipelineBar, Sparkline,
│           │   │                 #   InterviewRoundsEditor, ScheduleInterviewCard
│           │   └── modals/       # JDPreviewModal, InterviewScheduleModal,
│           │                     #   ConfigureRoundsModal, RescheduleInterviewModal
│           ├── hooks/            # usePdfBlobUrl, useBreakpoints
│           ├── constants/        # interviewConstants (ROUND_TYPE_OPTIONS, DEFAULT_INTERVIEW_ROUNDS)
│           ├── api/              # authApi, apiClient
│           └── types/            # index.ts (CandidateStatus, CandidateNote, JobRound, …)
├── Back-End/
│   └── ATStool/                  # .NET 10 Web API
│       ├── Controllers/
│       ├── Services/             # CandidateService, DashboardService, AtsScoreWorker, …
│       ├── Models/               # Job (InterviewRounds JSON), Application (SkippedRounds JSON)
│       ├── DTOs/
│       └── Migrations/
└── AI_Models/                    # Python FastAPI service
    ├── ats_scoring/
    ├── jd_creation/
    └── resume_extraction/
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- .NET 10 SDK
- Python 3.11+
- SQL Server (local or Azure)
- Azure Storage account (for resume blobs)
- SMTP credentials (for interview email notifications)

### Frontend
```bash
cd Front-End
npm install
npm run dev
```
Runs at `http://localhost:5173`.

### Backend
```bash
cd Back-End/ATStool
dotnet restore
dotnet run
```
Runs at `http://localhost:5122`.

### AI Service
```bash
cd AI_Models
pip install -r requirements.txt
python api_server.py
```
Runs at `http://localhost:8000`.

---

## Architecture Notes

### ATS Scoring Pipeline
Scoring runs asynchronously via a `Channel<AtsScoreJob>` queue processed by `AtsScoreWorker` (a .NET `BackgroundService`). Results are pushed to the frontend in real time over a persistent SSE connection at `GET /api/candidates/stream?jobId=`.

### Dynamic Interview Rounds
Each job folder stores its own ordered list of rounds (`Job.InterviewRounds: List<JobRound>`) as a JSON column. Rounds have `Order` (1-based), `Name`, and `Type`. The frontend `InterviewRoundsEditor` lets recruiters configure rounds at JD creation time and `ConfigureRoundsModal` allows editing later. The fixed 5-round label map has been removed — round names are always taken from the scheduled interview record directly.

### Candidate Status Model
Six statuses: `under_review` · `filtered` · `shortlisted` · `interviewing` · `selected` · `rejected`. The old `1st_round` through `5th_round` statuses are retired. All `Record<CandidateStatus, …>` maps in the frontend cover all six values.

### Email Notifications
Interview scheduling and rescheduling trigger SMTP emails with HTML templates. A `502` response (with the interview object) is returned if scheduling succeeded but the email failed, so the frontend can handle gracefully.

### PDF Handling
`usePdfBlobUrl` (shared hook) uses a ref-counted cache with deferred revoke to prevent flicker and memory leaks. The backend validates PDF magic bytes (`%PDF`) before accepting and serving any file.

---

## Portals & Accounts

| Role | Route |
|---|---|
| Recruiter | `/recruitment/...` |
| Interviewer | `/interviewer/...` |

Authentication is JWT-based (`POST /api/auth/login` body: `{ userName, password, role }`). The token is set by the backend in the `ATSAuth` **httpOnly cookie** and sent with `credentials: 'include'`; it is never readable from JavaScript. Roles: `Recruiter`, `Interviewer`, `Admin`.

> This README is being rewritten as part of the revive. Setup, deployment and demo accounts will be documented here.

---

## Design System

- **Theme:** Dark (`#0c0c0c` background), Sora font throughout
- **Card pattern:** Double-bezel — outer frosted shell + inner `#161719` panel, applied uniformly across all major panels
- **GlowOrb:** Ambient glow element included in every layout
- **Color language:** Green = active/success · Amber = pending · Blue = selected/AI · Purple = filtered · Red = error/rejected
- **Hover/focus colors:** Applied via inline JS handlers, not Tailwind color classes
- **Sidebar:** 240px desktop · 64px icon-only tablet · hidden mobile
- **Code quality:** SonarQube TS rules enforced — `readonly` props, `=== null`, `Number.isNaN()`, `?.`/`??` chains, `<button>` over `<div onClick>`
