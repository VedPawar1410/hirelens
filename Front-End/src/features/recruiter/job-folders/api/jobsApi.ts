import { apiFetch, apiFetchFormData } from '../../../../shared/api/apiClient'
import type { JobFolder, JobFolderStatus, TopCandidate } from '../../../../shared/types/index'

export interface ApiJobFolder {
  id: string
  jobTitle: string
  department: string
  location: string
  candidatesCount: number
  filteredCount?: number
  status: JobFolderStatus
  createdAt: string
  topCandidates?: { name: string; avatarUrl: string | null }[]
  applicationHistory?: number[]
}

export function mapJobFolder(raw: ApiJobFolder): JobFolder {
  return {
    id: raw.id,
    jobTitle: raw.jobTitle,
    department: raw.department,
    location: raw.location,
    candidatesCount: raw.candidatesCount,
    filteredCount: raw.filteredCount ?? 0,
    status: raw.status,
    createdAt: raw.createdAt,
    topCandidates: (raw.topCandidates ?? []).map((c): TopCandidate => ({
      name: c.name,
      avatarUrl: c.avatarUrl,
    })),
    applicationHistory: raw.applicationHistory ?? [],
  }
}

interface ApiJobFolderList {
  jobs: ApiJobFolder[]
  total: number
  page: number
  limit: number
}

export interface JobFolderList {
  jobs: JobFolder[]
  total: number
  page: number
  limit: number
}

// ── Raw API shape for upload response ────────────────────────────────────────

export type UploadFileStatus = 'created' | 'new_application' | 'already_applied' | 'failed' | 'categorized' | 'unmatched'

interface ApiUploadResult {
  processed: number
  categorized: Array<{
    fileName: string
    status: UploadFileStatus
    matchedJob: { id: string; title: string } | null
    candidateId: string | null
    error: string | null
    atsScore: number | null
  }>
}

// ── Mapped type ───────────────────────────────────────────────────────────────

export interface UploadResult {
  processed: number
  results: Array<{
    fileName: string
    status: UploadFileStatus
    matchedJob: { id: string; title: string } | null
    candidateId: string | null
    error: string | null
    atsScore: number | null
  }>
}

// ── Endpoints ─────────────────────────────────────────────────────────────────
//
// GET  /api/jobs?page=1&limit=20
//   → { jobs: [...], total: number, page: number, limit: number }
//   Each job: { id, jobTitle, department, location, candidatesCount, status, createdAt }
//   status: 'active' | 'closed' | 'paused'
//
// POST  /api/resumes/upload   (multipart/form-data)
//   Field name: "files" (one or more PDF/DOCX files)
//   Optional field: "jobId" — when provided, backend skips ATS matching and
//   places files directly in that folder. Omit to let the backend auto-categorize.
//   → { processed: number, categorized: [{ filename, matchedJob, status }] }

export async function getJobFolders(page = 1, limit = 20): Promise<JobFolderList> {
  const raw = await apiFetch<ApiJobFolderList>(`/jobs?page=${page}&limit=${limit}`)
  return {
    jobs: raw.jobs.map(mapJobFolder),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
  }
}

export async function getJobFolder(id: string): Promise<JobFolder> {
  const raw = await apiFetch<ApiJobFolder>(`/jobs/${id}`)
  return mapJobFolder(raw)
}

export async function updateJobFolderStatus(id: string, status: JobFolderStatus): Promise<void> {
  await apiFetch<void>(`/jobs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ folderStatus: status }),
  })
}

export async function uploadResumes(
  files: File[],
  jobId?: string,
  onBatchComplete?: (done: number, total: number) => void,
  onBatchResult?: (results: UploadResult['results'], processed: number) => void,
): Promise<UploadResult> {
  // Split into ~10% batches (minimum 1 file per batch)
  const batchSize = Math.max(1, Math.ceil(files.length / 10))
  const batches: File[][] = []
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize))
  }

  let completed = 0
  const total = batches.length

  // Batches are sent sequentially: each batch waits for extraction + ATS scoring to complete
  // before the next is sent, so upload and processing run simultaneously in a pipeline.
  type BatchResult =
    | { ok: true; raw: ApiUploadResult; mapped: UploadResult['results'] }
    | { ok: false; files: File[]; failed: UploadResult['results'] }

  const batchResults: BatchResult[] = []

  for (const batch of batches) {
    const formData = new FormData()
    for (const file of batch) formData.append('files', file)
    if (jobId) formData.append('jobId', jobId)
    try {
      const raw = await apiFetchFormData<ApiUploadResult>('/resumes/upload', formData)
      onBatchComplete?.(++completed, total)
      const mapped = raw.categorized.map(item => ({
        fileName: item.fileName,
        status: item.status,
        matchedJob: item.matchedJob,
        candidateId: item.candidateId,
        error: item.error,
        atsScore: item.atsScore,
      }))
      // Stream this batch's results to the UI immediately before sending the next batch
      onBatchResult?.(mapped, raw.processed)
      batchResults.push({ ok: true, raw, mapped })
    } catch {
      onBatchComplete?.(++completed, total)
      const failed = batch.map(file => ({
        fileName: file.name,
        status: 'failed' as const,
        matchedJob: null,
        candidateId: null,
        error: 'Upload failed',
        atsScore: null,
      }))
      onBatchResult?.(failed, batch.length)
      batchResults.push({ ok: false, files: batch, failed })
    }
  }

  // Merge all batch results for the final onSuccess value
  let totalProcessed = 0
  const results: UploadResult['results'] = []

  for (const r of batchResults) {
    if (r.ok) {
      totalProcessed += r.raw.processed
      results.push(...r.mapped)
    } else {
      results.push(...r.failed)
      totalProcessed += r.files.length
    }
  }

  return { processed: totalProcessed, results }
}
