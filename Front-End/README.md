# HireLens — Frontend

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript strict (`erasableSyntaxOnly:true`) |
| Build | Vite |
| Routing | TanStack Router — `navigate({ to:'/path' })` always, object syntax |
| Server state | TanStack Query v5 |
| Styling | Tailwind CSS 4 + inline JS handlers for all hover/focus colors |
| Icons | Lucide React |
| Font | Sora |

## Testing

- **Runner:** Vitest 4 + jsdom + `@testing-library/react` 16 + `@testing-library/user-event` 14
- **Config:** `vitest.config.ts` — globals, jsdom env, setup `src/test/setup.ts`
- **Setup stubs:** `matchMedia`, `ResizeObserver`, `IntersectionObserver`, `URL.createObjectURL/revokeObjectURL`
- **Coverage:** `npm run test:coverage` — v8 provider, excludes `router.tsx` / `main.tsx` / configs
- **Location:** all tests in `tests/` subdirectories co-located with the code they test
- **Conventions:** `src/test/CONVENTIONS.md`

## Code Quality

SonarQube TypeScript rules enforced (`npm run lint`):
- All component props `readonly`; `=== null` strict equality; `Number.isNaN()`; no `continue`
- Optional chaining over null-guard chains; nested ternaries extracted to helpers; `<button>` not `<div onClick>`

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run lint
npm run test       # vitest run (single pass)
npm run test:watch # vitest watch mode
npm run test:ui    # vitest UI
npm run test:coverage
```

Set `VITE_API_BASE_URL` in `.env.local` (default: `http://localhost:5275`).

## Project Structure

Feature-sliced: `src/features/<name>/{api,hooks,components,pages}` + `src/shared/`

```
src/
├── shared/
│   ├── api/          # apiClient.ts (apiFetch+SSE helpers, cookie auth — no Authorization header)
│   │                 # authApi.ts (login, logout, getMe, getInterviewers)
│   ├── components/
│   │   ├── ui/       # ALL shared UI: PrimaryButton · GhostButton · Spinner · StatusBadge
│   │   │             # FormInput · FormSelect · Avatar · ActionButton · JobFolderStatusChip
│   │   │             # BezelCard · StatCard · GlowOrb · DownloadButton · UploadProgressBanner
│   │   │             # NoteComposer (API-backed notes) · FeedbackFormFields · CandidateActions
│   │   │             # MatchBadge · PipelineBar · Sparkline · InterviewRoundsEditor
│   │   ├── modals/   # JDPreviewModal · InterviewScheduleModal · ConfigureRoundsModal · RescheduleInterviewModal
│   │   ├── layout/   # RecruitmentLayout · InterviewerLayout
│   │   └── Toast/    # Toast · ToastProvider
│   ├── constants/    # interviewConstants.ts (ROUND_TYPE_OPTIONS, DEFAULT_INTERVIEW_ROUNDS)
│   ├── context/      # AuthContext · UploadProgressContext
│   ├── hooks/        # useAuth · useToast · useLoginAnimation · useWindowSize
│   │                 # useBreakpoints (use this instead of useWindowSize directly)
│   │                 # usePdfBlobUrl (base64→blobUrl, ref-counted cache, 30s deferred revoke)
│   ├── lib/          # queryClient.ts · dateUtils.ts · matchScoreUtils.ts · candidateUtils.ts
│   │                 # urlUtils.ts (toSafeHttpUrl — http(s) allowlist for user-supplied hrefs)
│   │                 # session.ts (ensureSession — /auth/me cache for router guards + AuthProvider)
│   └── types/        # index.ts (frontend types), api.ts (Api* shapes — never in UI)
├── features/
│   ├── auth/         # pages/LoginPage, components/
│   ├── recruiter/    # ALL recruiter features nested here
│   │   ├── dashboard/    # api/dashboardApi, pages/DashboardPage
│   │   │                 # components/(ApplicationVolumeChart, NeedsAttentionPanel, PipelineFunnelPanel, RecentJobFolders)
│   │   ├── job-folders/  # api/jobsApi (owns ApiJobFolder+mapJobFolder+uploadResumes),
│   │   │                 # pages/(JobsPage, JobFolderDetailPage), components/(JDPickerStep, UploadResumeModal)
│   │   ├── candidates/   # api/(candidatesApi, interviewsApi)
│   │   │                 # pages/(CandidatesPage[virtualized], CandidateDetailPage)
│   │   │                 # components/candidatespage/(CandidateCard, CandidateRow)
│   │   │                 # components/candidatedetailpage/(ScheduleInterviewCard [w/ reschedule],
│   │   │                 #   InterviewFeedbackCard [collapsible, polls 15s], CandidateProfileHeader,
│   │   │                 #   ResumeCard, JdCard, PipelineCard)
│   │   └── jd-creation/  # api/jdApi (owns mapDraft), queryKeys.ts, hooks/useJDMutations
│   │                     # pages/JDCreationPage, components/, constants/jd.ts
│   └── interviewer/  # feature-sliced
│       ├── hooks/        # shared interviewer hooks
│       ├── dashboard/    # pages/DashboardPage (inline detail via selectedInterview)
│       │                 # components/dashboardpage/(InterviewCard)
│       │                 # components/candidatedetailpage/(CandidateHeader, InterviewDetailsCard,
│       │                 #   ResumeCard, JobDescCard, PipelineCard, FeedbackSection)
│       ├── candidates/   # pages/MyCandidatesPage, types.ts, utils.ts, components/
│       └── jd-creation/  # pages/JDCreationPage (split-pane, polls 5s)
│                         # components/DraftListView · DraftDetailView
├── router.tsx        # All routes (async auth guard: await ensureSession() + role check).
│                     # staticData:{title} on all 10 leaf routes.
│                     # router.subscribe('onResolved') sets document.title = "Page · HireLens"
└── App.tsx           # QueryClientProvider → AuthProvider → UploadProgressProvider → ToastProvider → RouterProvider
```

**Rule:** `shared/` never imports from `features/`.

## Key Invariants

| Rule | Detail |
|---|---|
| API boundary | `ApiDraft` (nullable) → `mapDraft()` → `JDDraft`. Never use `Api*` in components. |
| Navigation | `navigate({ to: '/path' })` — TanStack Router object syntax only |
| Hover/focus color | Inline JS handlers only. No Tailwind color classes for hover/focus. |
| `ApiJobFolder` owner | `recruiter/job-folders/api/jobsApi.ts` — never redefine elsewhere |
| `CandidateStatus` | 6 values: `under_review\|filtered\|shortlisted\|interviewing\|selected\|rejected`. Every `Record<CandidateStatus,…>` must cover all 6. |
| Stage sync | `CandidateService.StageOrder` (backend) must match `STAGE_ORDER` (frontend) — both 5-element arrays (no round numbers) |
| Candidate mutations | All stage mutations pass `?jobId=` as query param — no request body |
| `usePdfBlobUrl` | Always use this hook for base64 PDFs — never inline `URL.createObjectURL` without cleanup |
| Auth | `ATSAuth` HttpOnly cookie only — never read/store tokens in JS; `credentials: 'include'` on every fetch; session restore via `ensureSession()` (`GET /auth/me`) |
| User-supplied hrefs | `toSafeHttpUrl()` from `shared/lib/urlUtils.ts` on anything rendered into `href` (resume links, meeting links) — http(s) allowlist |
| CSP | Injected into prod builds by `cspPlugin` in `vite.config.ts` — never add a CSP meta to `index.html` (breaks dev react-refresh preamble) |
| SSE subscriptions | Use `subscribeAtsScoreStream` / `subscribeEventStream` — both return cleanup fns; call on unmount |
| `applicationHistory` | `JobFolder.applicationHistory: number[]` comes from backend — never compute client-side |

## Responsive Breakpoints

| Width | Sidebar | Candidates |
|---|---|---|
| <768 | hidden | card layout |
| 768–1023 | 64px icon | table 5 cols (drops SOURCE + APPLIED DATE), `table-fixed` |
| ≥1024 | 240px full | table 7 cols |

## Design System

| Token | Value |
|---|---|
| background | `#0c0c0c` |
| surface | `#161719` |
| surface-2 | `#1a1d20` |
| border | `#37373f` |
| accent | `#1d2ba4` / hover `#12219e` |
| text-muted | `#9ca3af` |
| font | `Sora, sans-serif` |

**Double-bezel card:** outer `bg:rgba(255,255,255,0.025) border:rgba(255,255,255,0.06) r:18 p:3` · inner `bg:#161719 r:16 shadow:inset 0 1px 0 rgba(255,255,255,0.07)`. Small variant: `r:14 p:2` / `r:12`.

## Routing

| Path | Component | Role |
|---|---|---|
| `/` | → `/login` | — |
| `/login` | `LoginPage` | Public |
| `/recruitment` | → `/recruitment/dashboard` | recruitment |
| `/recruitment/dashboard` | `DashboardPage` | recruitment |
| `/recruitment/jd-creation` | `JDCreationPage` | recruitment |
| `/recruitment/jobs` | `JobsPage` | recruitment |
| `/recruitment/jobs/$jobId` | `JobFolderDetailPage` | recruitment | search: `stage?` |
| `/recruitment/candidates` | `CandidatesPage` | recruitment | search: `status?`, `filter?` |
| `/recruitment/candidates/$id` | `CandidateDetailPage` | recruitment | search: `jobId?`, `fromJobFolder?`, `stage?`, `prevId?`, `nextId?` |
| `/interviewer` | → `/interviewer/dashboard` | interviewer |
| `/interviewer/dashboard` | `interviewer/dashboard/pages/DashboardPage` | interviewer |
| `/interviewer/candidates` | `interviewer/candidates/pages/MyCandidatesPage` | interviewer |
| `/interviewer/jd-creation` | `interviewer/jd-creation/pages/JDCreationPage` | interviewer |
| `*` | → `/login` | — |

## Candidate Detail & PDF Rendering

- `CandidateDetailPage` renders resume and JD as `<iframe>` using `usePdfBlobUrl(base64)` (ref-counted cache — shared URL for same base64, 30s deferred revoke after last unmount). Falls back to generated-JD text when `jobDescBase64` is null. `ResumeCard` and `JdCard` accept `isLoading`/`documentIsLoading` props for loading states.
- Backend: `GET /api/candidates/:id/:jobId/detail?includeJobDescription=false` — pass `false` to skip JD blob fetch. Returns `resumeBase64`, `jobDescBase64`, `resumeFileName`, `jobDescFileName`, `isDuplicate`, `applicationSource`
- Contact info (email/phone/LinkedIn/GitHub) is an inline `flex-wrap` row inside the header card — not a separate card
- Status badge in header name row (`marginLeft:auto`); not in AI Analysis Engine section
- Integrated **Schedule Interview** (`ScheduleInterviewCard` — driven by `job.interviewRounds`, inline skip/unskip per round, mode/duration/location/meetingLink fields; shows scheduled rounds with a **Reschedule** button per round that opens `RescheduleInterviewModal`) and **Interview Feedback** (`InterviewFeedbackCard` — collapsible, per-round tab chips, polls 15s). `feedbackOpen` defaults to `true`.
- **Candidate Notes**: `NoteComposer` renders a per-candidate note feed. API-backed (not localStorage). queryKey `['candidate-notes', candidateId]`. Polls every 10s (`staleTime:0`). Supports optimistic add/delete, author-only delete, Cmd/Ctrl+Enter to post. Primary left-column slot in candidate detail (above ResumeCard).
- `canMoveToSelected`: all configured rounds must be either `Completed` or skipped before "Next Stage →" is enabled (checked in `CandidateDetailPage`, wired as `PipelineCard.isNextDisabled`).
- `ROUND_TYPE` static map **removed** — round type comes from `JobRound.type` configured per job.

### Navigation context (from Job Folder)
When `fromJobFolder=true` is in search params:
- **Back button** → `/recruitment/jobs/$jobId?stage=<stage>` (restores the kanban column)
- **Prev/Next arrows** iterate candidates in the same stage using the `['candidates',{jobId}]` TanStack Query cache
- `stage` search param is passed forward on every prev/next navigate to keep context intact
- `CandidateDetailPanel` exposes `onViewProfile: () => void` — navigate lives in `JobFolderDetailPage` where `selectedStage` is in scope

## Kanban (`JobFolderDetailPage`)

- Whole card is clickable → navigates to candidate detail with `?jobId=` search param
- `ScoreBar` inline component: green ≥80 / amber ≥50 / red <50; shows "Computing…" during AI scoring
- Generate Scores → `subscribeAtsScoreStream(jobId, onBatch, onError)` — persistent SSE. Server pushes all candidates immediately on connect, then batches as `AtsScoreWorker` scores.
- Score badge: `null`=hidden · `-1`=`"..."` grey · other neg=`"Failed"` red · `≥0`=%.
- Status-aware card actions: Shortlist (pre-pipeline) / advance label (interview rounds) / Reject (all active)
- Stage mutations invalidate both `['candidates']` and `['jobs']` so header counts refresh

## CandidatesPage

- **Virtualized** rows (desktop/tablet) and cards (mobile) via `@tanstack/react-virtual`
- Server-side sort (`sortBy`, `sortDir`) and ATS Top Picks filter (`minScore=80`) — not client-side
- Default `limit=50`. Search is SQL-side (no in-memory filtering)
- Route has `validateSearch` for `status` + `filter` params — required for typed search param navigation
- `getCandidateCounts()` → `GET /api/candidates/counts` for per-stage totals sidebar

## Interviewer Dashboard

- **Layout:** Full-width header + 4 stat cards, then `flex` row: left col (week-strip + interview sections) + right `StatsPanel` (w-272px, only `width >= 1024`).
- **Breakpoints:** `isMobile < 640` · `isTablet 640–1023` · desktop `>= 1024`. Same padding tokens as recruiter pages.
- **Week-strip:** `selectedDay: Date|null` state. Clicking a day filters "Today" section to that date and hides "Later This Week". Today = purple highlight, selected non-today = blue. Clicking the already-active today cell resets to null.
- **`StatsPanel`:** "This month" count · "Avg rating given" (`/5`) · "On-time" % · "Feedback in" (`d`). SVG 4-week sparkline. "↑ trending" text badge (not a Lucide icon). Recent activity list. Prep Tip with "Open candidate" button.
- **`InterviewCard`:** `·` separators between round · type · job title. Never `→`.

## JD Creation Panel

- `LiveSummaryPanel`: field-row summary (LayoutGrid icon + "Live Summary" title). Shows Job Title, Experience Level, Location, Work Mode, Work Hours, level-specific fields (Intern: Duration + Stipend; Experienced: Years + Notice Period), Role Description, Assigned To. Footer: "Completion" label + "Ready" (green) or `n%` + progress bar.
- Click-outside-to-close: `stopPropagation` on the form card wrapper and the LiveSummaryPanel wrapper individually — **not** on their shared flex row. The outer page `<div onClick={resetForm}>` fires when clicking anywhere on the page background.

## Common Gotchas

- **`Avatar` null-safe:** `name` prop is `string | null | undefined`. Initials render immediately as base layer; image overlays at `opacity:0` and fades in on load — no flash.
- **`mutationFn` wrapping:** TanStack Query v5 injects context as 2nd arg — always `mutationFn: (id) => fn(id)`
- **`submitDraft`:** body must be `'{}'` — .NET rejects empty body
- **Folder upload:** use `webkitGetAsEntry()` — `e.dataTransfer.files` is empty for folders
- **Bezel scroll:** `overflow-x-auto` on the bezel div, `overflow-hidden` only for mobile — nesting breaks scroll
- **`JDPreviewModal`:** `left:sidebarOffset` (240/64/0), not `inset:0`
- **`ApplicationVolumeChart` `smoothPath`:** always pass `chartBottom` as 2nd arg — prevents curve dipping below the zero axis. ResizeObserver uses callback ref (not `useRef + []`) so it attaches even when the container mounts after initial render. Line draws via stroke-dashoffset animation; `animKey` restarts it on dataset change.
- **`CandidatesPage` dedup key:** `${c.id}::${c.appliedJob?.id ?? ''}` — not `c.id` alone (same candidate can apply to multiple jobs). Scroll reset uses `virtualizer.scrollToIndex(0)` — not raw DOM `scrollTo`.
- **`usePdfBlobUrl`:** Module-level ref-counted cache — multiple consumers sharing the same base64 get one URL. `atob()` in try/catch → `null` on invalid base64. Revoke deferred 30s after last consumer unmounts (not immediately). Cache validates `URL.createObjectURL` identity to handle test mock resets.
