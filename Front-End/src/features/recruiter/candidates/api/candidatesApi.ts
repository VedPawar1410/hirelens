import { apiFetch, apiFetchEventStream, subscribeEventStream } from '../../../../shared/api/apiClient'
import type { Candidate, CandidateDetail, CandidateStatus, ApplicationSource, CandidateNote } from '../../../../shared/types/index'

// ── Raw API shapes (camelCase from server) ──────────────────────────────────

interface ApiCandidate {
  id: string
  name: string
  currentRole: string
  avatarUrl: string | null
  matchScore: number | null
  isDuplicate: boolean
  appliedJob: { id: string; title: string } | null
  applicationSource: ApplicationSource
  status: CandidateStatus
  currentRound: string | null
  appliedDate: string
  email: string | null
  phone: string | null
  linkedIn: string | null
  gitHub: string | null
  skills: string[] | null
  experience: number | null
  education: string | null
}

// Shape returned by GET /candidates/{candidateId}/{jobId}/detail
interface ApiCandidateDetail {
  id: string
  name: string
  currentRole: string | null
  avatarUrl: string | null
  matchScore: number | null
  isDuplicate: boolean
  appliedJob: { id: string; title: string } | null
  applicationSource: string | null
  status: string | null
  currentRound: string | null
  appliedDate: string | null
  email: string | null
  phone: string | null
  linkedIn: string | null
  gitHub: string | null
  skills: string[] | null
  experience: number | null
  education: string | null
  skippedRounds: number[] | null
  resumeBase64: string | null
  jobDescBase64: string | null
  resumeFileName: string | null
  jobDescFileName: string | null
}

interface ApiCandidateList {
  candidates: ApiCandidate[]
  total: number
  page: number
  limit: number
}

// ── Mapped types ──────────────────────────────────────────────────────────────

export interface CandidateList {
  candidates: Candidate[]
  total: number
  page: number
  limit: number
}

export interface CandidateListParams {
  page?: number
  limit?: number
  status?: CandidateStatus | ''
  search?: string
  jobId?: string
  sortBy?: 'matchScore' | 'name' | 'appliedDate'
  sortDir?: 'asc' | 'desc'
  minScore?: number
}

// ── Narrow helpers — validate server strings before casting ───────────────────

const VALID_STATUSES = new Set<string>([
  'under_review', 'filtered', 'shortlisted', 'interviewing',
  'selected', 'rejected',
])

const VALID_SOURCES = new Set<string>(['LinkedIn API', 'Direct Upload'])

function toStatus(raw: string | null): CandidateStatus {
  return raw !== null && VALID_STATUSES.has(raw) ? (raw as CandidateStatus) : 'under_review'
}

function toApplicationSource(raw: string | null): ApplicationSource {
  return raw !== null && VALID_SOURCES.has(raw) ? (raw as ApplicationSource) : 'Direct Upload'
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapCandidate(raw: ApiCandidate): Candidate {
  return {
    id: raw.id,
    name: raw.name,
    currentRole: raw.currentRole,
    avatarUrl: raw.avatarUrl,
    matchScore: raw.matchScore,
    isDuplicate: raw.isDuplicate,
    appliedJob: raw.appliedJob,
    applicationSource: raw.applicationSource,
    status: raw.status,
    currentRound: raw.currentRound,
    appliedDate: raw.appliedDate,
    email: raw.email,
    phone: raw.phone,
    linkedIn: raw.linkedIn,
    gitHub: raw.gitHub,
    skills: raw.skills,
    experience: raw.experience,
    education: raw.education,
  }
}

// ── Endpoints ─────────────────────────────────────────────────────────────────
//
// GET  /api/candidates?page=1&limit=20&status=&search=&jobId=
//   → { candidates: [...], total, page, limit }
//   Candidate fields: { id, name, currentRole, avatarUrl, matchScore, isDuplicate,
//     appliedJob: { id, title }, applicationSource, status, appliedDate }
//   status values: 'under_review' | 'filtered' | 'shortlisted' | 'interviewing' | 'selected' | 'rejected'
//   applicationSource: 'LinkedIn API' | 'Direct Upload'
//
// PATCH /api/candidates/:id/stage
//   → { status: CandidateStatus }  — advances candidate to the next pipeline stage
//
// PATCH /api/candidates/:id/shortlist
//   → { status: 'shortlisted' }
//
// PATCH /api/candidates/:id/assign
//   Body: { interviewerIds: string[] }
//   → { assigned: boolean }

export async function getCandidates(params: CandidateListParams = {}): Promise<CandidateList> {
  const { page = 1, limit = 50, status = '', search = '', jobId = '', sortBy, sortDir, minScore } = params
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) qs.set('status', status)
  if (search) qs.set('search', search)
  if (jobId) qs.set('jobId', jobId)
  if (sortBy) qs.set('sortBy', sortBy)
  if (sortDir) qs.set('sortDir', sortDir)
  if (minScore !== undefined) qs.set('minScore', String(minScore))

  const raw = await apiFetch<ApiCandidateList>(`/candidates?${qs.toString()}`)
  return {
    candidates: raw.candidates.map(mapCandidate),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
  }
}

export async function moveToNextStage(
  candidateId: string,
  jobId?: string
): Promise<{ status: CandidateStatus }> {
  const qs = jobId ? `?jobId=${jobId}` : ''
  return apiFetch(`/candidates/${candidateId}/stage${qs}`, { method: 'PATCH' })
}

export async function shortlistCandidate(
  candidateId: string,
  jobId?: string
): Promise<{ status: CandidateStatus }> {
  const qs = jobId ? `?jobId=${jobId}` : ''
  return apiFetch(`/candidates/${candidateId}/shortlist${qs}`, { method: 'PATCH' })
}

export async function moveToPreviousStage(
  candidateId: string,
  jobId?: string
): Promise<{ status: CandidateStatus }> {
  const qs = jobId ? `?jobId=${jobId}` : ''
  return apiFetch(`/candidates/${candidateId}/prev-stage${qs}`, { method: 'PATCH' })
}

export async function rejectCandidate(
  candidateId: string,
  jobId?: string
): Promise<{ status: CandidateStatus }> {
  const qs = jobId ? `?jobId=${jobId}` : ''
  return apiFetch(`/candidates/${candidateId}/reject${qs}`, { method: 'PATCH' })
}

interface CandidateDetailOptions {
  includeJobDescription?: boolean
}

export async function getCandidateById(
  id: string,
  jobId: string,
  options: CandidateDetailOptions = {},
): Promise<CandidateDetail> {
  const qs = new URLSearchParams()
  if (options.includeJobDescription === false) qs.set('includeJobDescription', 'false')
  const query = qs.toString()
  const suffix = query ? `?${query}` : ''
  const raw = await apiFetch<ApiCandidateDetail>(`/candidates/${id}/${jobId}/detail${suffix}`)
  return {
    id: raw.id,
    name: raw.name,
    currentRole: raw.currentRole ?? '',
    avatarUrl: raw.avatarUrl,
    matchScore: raw.matchScore === null ? null : Math.round(raw.matchScore),
    isDuplicate: raw.isDuplicate,
    appliedJob: raw.appliedJob,
    applicationSource: toApplicationSource(raw.applicationSource),
    status: toStatus(raw.status),
    currentRound: raw.currentRound,
    appliedDate: raw.appliedDate ?? '',
    email: raw.email,
    phone: raw.phone,
    linkedIn: raw.linkedIn,
    gitHub: raw.gitHub,
    skills: raw.skills,
    experience: raw.experience,
    education: raw.education,
    skippedRounds: raw.skippedRounds ?? [],
    resumeBase64: raw.resumeBase64,
    jobDescBase64: raw.jobDescBase64,
    resumeFileName: raw.resumeFileName,
    jobDescFileName: raw.jobDescFileName,
  }
}

export async function assignCandidateToInterviewer(
  candidateId: string,
  interviewerIds: string[]
): Promise<{ assigned: boolean }> {
  return apiFetch(`/candidates/${candidateId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ interviewerIds: interviewerIds }),
  })
}

// Connects to the persistent SSE stream for a job. On connect the server immediately pushes
// all current candidates, then pushes batches as the worker finishes scoring chunks.
// onBatch is called for each push; callers should merge into their query cache by id.
export async function generateAtsScores(
  jobId: string,
  onBatch?: (batch: Candidate[]) => void
): Promise<void> {
  await apiFetchEventStream<ApiCandidate[]>(
    `/candidates/stream?jobId=${jobId}`,
    batch => {
      if (onBatch) onBatch(batch.map(mapCandidate))
    },
    { method: 'GET' }
  )
}

// Long-lived subscription version — returns an unsubscribe/cleanup fn.
// Preferred over generateAtsScores for component-bound subscriptions.
export function subscribeAtsScoreStream(
  jobId: string,
  onBatchResult: (batch: Candidate[]) => void,
  onError?: (error: unknown) => void
): () => void {
  return subscribeEventStream<ApiCandidate[]>(
    `/candidates/stream?jobId=${jobId}`,
    batch => onBatchResult(batch.map(mapCandidate)),
    onError
  )
}

export interface CandidateStageCounts {
  underReview: number
  filtered: number
  shortlisted: number
  interviewing: number
  selected: number
  rejected: number
  topMatches: number
}

export async function getCandidateCounts(): Promise<CandidateStageCounts> {
  return apiFetch<CandidateStageCounts>('/candidates/counts')
}

export async function getCandidateStageCountsByJob(jobId: string): Promise<Record<string, number>> {
  return apiFetch<Record<string, number>>(`/candidates/job-stage-counts?jobId=${encodeURIComponent(jobId)}`)
}

export async function selectWithNotify(
  candidateId: string,
  jobId: string,
): Promise<{ status: string }> {
  return apiFetch(`/candidates/${candidateId}/select-with-notify?jobId=${encodeURIComponent(jobId)}`, {
    method: 'POST',
  })
}

export function getCandidateNotes(candidateId: string): Promise<CandidateNote[]> {
  return apiFetch<CandidateNote[]>(`/candidates/${candidateId}/notes`)
}

export function addCandidateNote(candidateId: string, text: string): Promise<CandidateNote> {
  return apiFetch<CandidateNote>(`/candidates/${candidateId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export function deleteCandidateNote(candidateId: string, noteId: string): Promise<void> {
  return apiFetch<void>(`/candidates/${candidateId}/notes/${noteId}`, { method: 'DELETE' })
}
