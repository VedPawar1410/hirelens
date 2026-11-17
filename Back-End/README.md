# HireLens — Backend

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | ASP.NET Core .NET 10 |
| ORM | EF Core 10 + SQL Server (Azure) |
| Auth | ASP.NET Core Identity + JWT (HttpOnly cookie `ATSAuth`) |
| Background | `BackgroundService` (`AtsScoreWorker`) |
| Async queue | `System.Threading.Channels` (unbounded channel) |
| Real-time | Server-Sent Events (`SseService`) |
| Blob storage | Azure Blob Storage (`BlobService`) |
| AI/ML | Python FastAPI at `ExternalApi:ParsingUrl` (default `http://localhost:8000`) |
| Serialization | `JsonNamingPolicy.CamelCase` globally — no `[JsonPropertyName]` ever |

## Quick Start

```bash
cd Back-End/ATStool

# Restore and run
dotnet restore
dotnet run

# Apply pending migrations
dotnet ef database update
```

Set connection strings and secrets in `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=ATStool;..."
  },
  "Jwt": {
    "Key": "<secret>",
    "Issuer": "ATStool",
    "Audience": "ATStool"
  },
  "AzureBlob": {
    "ConnectionString": "<blob-conn-string>",
    "ContainerName": "<container>"
  },
  "ExternalApi": {
    "ParsingUrl": "http://localhost:8000"
  },
  "ATSScoreGeneration": {
    "BaseUrl": "http://localhost:8000"
  },
  "AllowedOrigins": ["http://localhost:5173"]
}
```

## Project Structure

```
ATStool/
├── Controllers/
│   ├── AuthController.cs        — /api/auth
│   ├── JobController.cs         — /api/drafts (JD creation flow)
│   ├── JobFolderController.cs   — /api/jobs (job folder management)
│   ├── CandidateController.cs   — /api/candidates (+ SSE stream + notes)
│   ├── ResumeController.cs      — /api/resumes
│   ├── DashboardController.cs   — /api/dashboard
│   └── InterviewsController.cs  — /api/interviews
├── Models/
│   ├── User.cs                  — ASP.NET Identity user
│   ├── Job.cs                   — JD draft; owns JobRound[] (JSON column)
│   ├── Application.cs           — candidate↔job link; owns SkippedRound[] (JSON column)
│   ├── Candidate.cs
│   ├── Resume.cs
│   ├── Interview.cs             — scheduling + feedback; RescheduleCount
│   ├── JobRound.cs              — { Order, Name, Type } — owned by Job
│   ├── SkippedRound.cs          — { Round, SkippedBy, SkippedAt } — owned by Application
│   ├── CandidateNote.cs         — { NoteId(Guid), CandidateId, AuthorId, AuthorName, Text, CreatedAt }
│   └── ApiResponse.cs           — generic wrapper { success, message, data, errors? }
├── DTOs/
│   ├── Auth/                    — RegisterDto · LoginDto · InterviewerDto
│   ├── Jobs/                    — CreateJobDto · PatchJobDto · AssignDraftDto · FinalizeDraftDto
│   │                              RoleDescriptionDto · DismissDraftDto · SkipRoundDto
│   ├── Candidates/              — CandidateNoteDto · AddNoteDto · UploadResumeRequest
│   └── Interviews/              — CreateInterviewDto · UpdateInterviewDto · SubmitFeedbackDto
│                                  RescheduleInterviewDto · SkipRoundDto
├── Services/
│   ├── Interfaces/              — I* interfaces for every service
│   ├── Repositories/            — CandidateRepository · ApplicationRepository · DraftRepository
│   ├── AuthService.cs           — register, login (sets ATSAuth cookie), logout, getInterviewers
│   ├── JobService.cs            — JD creation flow + PDF proxy + blob upload
│   ├── JobFolderService.cs      — job folder list/detail/status PATCH
│   ├── CandidateService.cs      — pipeline mutations, ATS counts, detail + PDF base64
│   ├── CandidateNoteService.cs  — uses IDbContextFactory (not scoped AppDbContext)
│   ├── InterviewService.cs      — schedule, reschedule, cancel, no-show, skip/unskip rounds
│   ├── InterviewEmailNotificationService.cs — posts to Python /send-interview-email etc.
│   ├── ResumeService.cs         — multipart upload → hash dedup → blob → DB → ATS queue
│   ├── DashboardService.cs      — stats, volume, funnel, attention items
│   ├── BlobService.cs           — Azure Blob CRUD (singleton)
│   ├── ExternalApiService.cs    — generic Python API proxy
│   ├── ParsingService.cs        — JD parsing/generation HTTP client (10 min timeout)
│   ├── HashService.cs           — SHA256 dedup for resumes
│   ├── TokenService.cs          — JWT mint
│   └── CategorizationService.cs — candidate categorization
├── Queue/
│   ├── AtsScoreJob.cs           — job payload for the channel
│   └── AtsScoreWorker.cs        — BackgroundService; reads channel, calls Python, updates DB, pushes SSE
├── Data/
│   └── AppDbContext.cs
├── Migrations/                  — EF Core migration history
├── Middleware/
│   └── GlobalExceptionHandler.cs
├── Constants/
│   └── AppRoles.cs              — "Admin" · "Recruitment" · "Interviewer"
└── Options/
    └── AzureBlobOptions.cs
```

## Authentication

JWT via HttpOnly cookie `ATSAuth` or `Authorization: Bearer <token>` header.

- **Roles:** `Admin` · `Recruitment` · `Interviewer`
- Token: symmetric HMAC-SHA256; issuer/audience validated.
- `[Authorize]` on all controllers; specific endpoints lock to `[Authorize(Roles = AppRoles.Recruitment)]` etc.
- Author identity in notes/interviews extracted from JWT claims: `ClaimTypes.NameIdentifier` (userId) + `ClaimTypes.GivenName` (name).

## API Endpoints

All routes require `[Authorize]` unless noted. All responses are camelCase JSON.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Create account → `{ id, username, email, userType }` |
| POST | `/login` | Public | Login → sets `ATSAuth` cookie + returns `{ token, user }` |
| POST | `/logout` | Any | Clears cookie |
| GET | `/interviewers` | Any | List all interviewer accounts `[{ id, username, fullName, email }]` |

### JD Drafts — `/api/drafts`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | Any | List drafts; `?createdBy=` (recruiter) or `?assignedTo=` (interviewer) |
| GET | `/{id}` | Any | Single draft by GUID |
| POST | `/` | Admin, Recruitment | Create draft + trigger AI JD generation |
| PATCH | `/{id}` | Admin, Recruitment | Update draft fields |
| PUT | `/{id}/interview-rounds` | Admin, Recruitment | Replace configured `JobRound[]` for the job |
| PATCH | `/{id}/assign` | Admin, Recruitment | Assign interviewers → status `"assigned"` |
| PATCH | `/{id}/role-description` | Any | Interviewer saves role description edits |
| PATCH | `/{id}/submit` | Any | Interviewer submits → status `"returned"` |
| POST | `/{id}/generate` | Admin, Recruitment | (Re)generate JD via Python AI |
| POST | `/{id}/finalize` | Admin, Recruitment | Approve JD → status `"finalized"`, PDF stored to blob |
| PATCH | `/{id}/dismiss` | Any | Remove a user from `assignedTo` |
| GET | `/{id}/pdf` | Any | Proxy/stream PDF binary from Python |
| GET | `/{id}/description` | Any | Stream finalized JD PDF from Azure Blob |
| DELETE | `/{id}` | Admin, Recruitment | Delete draft |

**Draft status flow:** `draft` → `assigned` → `returned` → `finalized`

### Job Folders — `/api/jobs`

| Method | Path | Description |
|---|---|---|
| GET | `/` | Paginated job folder list `?page=1&limit=20` |
| GET | `/{id}` | Single job folder with candidate counts + `applicationHistory[]` |
| PATCH | `/{id}/status` | Update folder status; body `{ folderStatus }` → `active|paused|closed` |

### Candidates — `/api/candidates`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List candidates; `?page&limit&status&search&jobId&sortBy&sortDir&minScore` |
| GET | `/{candidateId}/{jobId}/detail` | Full detail + resume/JD as base64; `?includeJobDescription=false` to skip JD fetch |
| GET | `/counts` | Global per-stage counts + `topMatches` (score ≥80) |
| GET | `/job-stage-counts?jobId=` | Per-stage counts for a single job folder |
| GET | `/stream?jobId=` | **SSE** — persistent connection; pushes candidates on connect + live score batches |
| PATCH | `/{candidateId}/stage?jobId=` | Advance to next pipeline stage |
| PATCH | `/{candidateId}/prev-stage?jobId=` | Move back one pipeline stage |
| PATCH | `/{candidateId}/shortlist?jobId=` | Directly shortlist |
| PATCH | `/{candidateId}/reject?jobId=` | Reject |
| GET | `/{candidateId}/notes` | List notes (newest-first) |
| POST | `/{candidateId}/notes` | Add note `{ text }` — author from JWT |
| DELETE | `/{candidateId}/notes/{noteId}` | Delete note — 403 if not author, 404 if missing |

**Pipeline stage order:** `under_review` → `filtered` → `shortlisted` → `interviewing` → `selected` (+ `rejected`)

### Resumes — `/api/resumes`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List resumes for a job `?jobId=` |
| POST | `/upload` | Multipart upload `[files] + jobId`; SHA256 dedup; queues ATS scoring |

### Dashboard — `/api/dashboard`

| Method | Path | Description |
|---|---|---|
| GET | `/stats` | `{ activeJobs, totalApplications, aiMatches, interviewsPending }` |
| GET | `/application-volume?period=7d` | `{ data: [{ day, apps }] }` — `7d|30d|90d` |
| GET | `/recent-job-folders?limit=3` | `{ folders: [JobFolderSummary] }` |
| GET | `/pipeline-funnel` | `{ stages, selectedRate, avgCycleDays }` |
| GET | `/attention-items` | `[{ type, count, title, subtitle, actionPath, nextInterviewAt?, ... }]` |

### Interviews — `/api/interviews`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | Any | All interviews |
| GET | `/upcoming?hours=24` | Any | Summary of next N hours `{ count, nextInterviewAt, nextCandidateName, ... }` |
| GET | `/{id}` | Any | Single interview |
| GET | `/candidate/{candidateId}` | Any | Interviews for a candidate |
| GET | `/job/{jobId}` | Any | Interviews for a job folder |
| GET | `/interviewer/{interviewerId}` | Any | Interviewer's schedule with enriched candidate details |
| GET | `/status/{status}` | Any | Filter by status |
| POST | `/schedule-round` | Any | Schedule a round → email notification; 502 if email fails |
| PUT | `/{id}` | Any | Full update |
| POST | `/{id}/feedback` | Any | Submit feedback + rating |
| PATCH | `/{id}/reschedule` | Any | Reschedule → increments `RescheduleCount`, sends email; 502 if email fails |
| PATCH | `/{id}/cancel` | Any | Cancel (email present, currently dummy success) |
| PATCH | `/{id}/no-show` | Any | Mark no-show |
| DELETE | `/{id}` | Any | Delete |
| POST | `/skip-round` | Recruitment | Skip a configured round for a candidate; returns `{ skippedRounds: int[] }` |
| POST | `/unskip-round` | Recruitment | Undo a skipped round |

**Interview status values:** `Scheduled` · `Completed` · `Cancelled` · `NoShow`

## ATS Scoring Architecture

```
POST /resumes/upload
  └─ ResumeService.ProcessUploadsAsync
       ├─ SHA-256 dedup (HashService)
       ├─ Azure Blob upload
       ├─ DB insert (Resume + Application rows)
       └─ Channel<AtsScoreJob>.Writer.WriteAsync(job)

AtsScoreWorker (BackgroundService)
  └─ Channel<AtsScoreJob>.Reader.ReadAsync()  (loop)
       ├─ POST http://AtsScoreClient/score
       ├─ UPDATE Candidate.ATSScore in DB
       └─ SseService.PushCandidatesAsync(jobId, candidates)

GET /candidates/stream?jobId=  (SSE)
  └─ SseService.AddConnection(jobId, Response)
       ├─ Immediate push of current candidates
       └─ Awaits RequestAborted (client disconnect)
```

**Score sentinels:** `null` = unscored (never queued) · `-1` = pending (in queue) · other negative = failed · `≥0` = score %

## Database

### EF Core Migrations (applied order)

| Migration | Change |
|---|---|
| `InitialCreate` | Core tables |
| `AddExperienceLevel` | `Job.ExperienceLevel` |
| `DropGeneratedIdColumn` | — |
| `AddResumes` | `Resumes` table |
| `MakeEmailNullable` | `Candidate.Email?` |
| `MakeNameNullable` | `Candidate.Name?` |
| `MakeAtsScoreNullable` | `Candidate.ATSScore?` |
| `20260512084727_AddInterviewTable` | `Interviews` table |
| `20260526060212_AddInterviewModeToInterview` | `Interview.InterviewMode` |
| `20260601_AddDynamicInterviewRounds` | `Job.InterviewRounds` JSON col · `Application.SkippedRounds` JSON col · `Interview.RoundName` · backfills status |
| `20260603063750_AddCandidateNotesTable` | `CandidateNotes` table |

```bash
# Apply all migrations
dotnet ef database update

# Add a new migration
dotnet ef migrations add <MigrationName>
```

### Key Relationships

- `Job` owns `JobRound[]` via `OwnsMany(...).ToJson()` (JSON column)
- `Application` owns `SkippedRound[]` via `OwnsMany(...).ToJson()` (JSON column)
- All foreign keys use `DeleteBehavior.Restrict`
- `AppDbContext` registered as `AddPooledDbContextFactory<AppDbContext>` (pool + factory for thread-safety)

## Key Invariants

| Rule | Detail |
|---|---|
| No `[JsonPropertyName]` | Global `JsonNamingPolicy.CamelCase` in `Program.cs`. Adding an attribute overrides the policy → wrong key → frontend crash. |
| `[FromQuery]` names | Must be camelCase (`jobId` not `job_id`). |
| `StageOrder` | `["under_review","filtered","shortlisted","interviewing","selected"]` in `CandidateService` — must match `STAGE_ORDER` in the frontend exactly. |
| `AssignedTo` stores usernames | `Job.AssignedTo: List<string>` holds Identity `UserName`, not GUIDs. `GetDraftsAsync(assignedTo)` matches with `OrdinalIgnoreCase`. |
| `IDbContextFactory` for notes | `CandidateNoteService` uses `IDbContextFactory<AppDbContext>` — not the scoped `AppDbContext` — to avoid concurrency issues with long-lived SSE request contexts. |
| Upload size limit | `MaxRequestBodySize = null` globally (Kestrel) + `[DisableRequestSizeLimit]` on the upload endpoint. |
| PDF validation | `IsValidPdf(byte[])` checks `%PDF` magic bytes before base64-encoding (returns null for candidates) or before blob upload (throws for JDs). |
| `interviewsPending` | `Dashboard.Stats.InterviewsPending` counts `Interviews` where `Status == "Scheduled"`. |
| Reschedule email | `PATCH /interviews/{id}/reschedule` calls `SendInterviewRescheduledAsync` — this is active. Cancel email is present but commented out (returns dummy success). |
| 502 on email failure | Schedule and reschedule endpoints return `502` (not `500`) when the interview row was saved but email notification failed — frontend can show a specific warning. |

## Interview Email Notifications

`InterviewEmailNotificationService` posts camelCase JSON to Python AI/ML service:

| Event | Endpoint |
|---|---|
| Schedule | `POST /send-interview-email` |
| Reschedule | `POST /reschedule-interview` |
| Cancel | `POST /cancel-interview` (commented out — dummy success) |

`RescheduleInterviewDto` carries `resumeBase64` + `jdBase64` so the email can include PDF attachments. `Interview.InterviewMode` and `Location` are derived from `MeetingLink` (online → `"Microsoft Teams Meeting"`, offline → `"Company Office"`). Each reschedule increments `Interview.RescheduleCount`.

## Roles

| Constant | Value | Description |
|---|---|---|
| `AppRoles.Admin` | `"Admin"` | Full access |
| `AppRoles.Recruitment` | `"Recruitment"` | Recruiter portal |
| `AppRoles.Interviewer` | `"Interviewer"` | Interviewer portal |

Roles are seeded on startup via `SeedRoles()` if they don't exist.

## Response Shape

Most endpoints wrap responses in:

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

Exception: candidates list, job folders, SSE, and interview endpoints return data directly (not wrapped). Validation errors include a `fields` map: `{ "fieldName": "error message" }`.

`GlobalExceptionHandler` middleware catches unhandled exceptions and returns a structured 500.
