import { apiFetch } from '../../../../shared/api/apiClient'

// ── Raw API shape ─────────────────────────────────────────────────────────────
//
// GET /api/resumes?jobId={id}
//   → { resumes: [...] }
//   Each resume: { id, filename, uploadedAt, status, matchScore, candidateId, errorReason }
//   status: 'processed' | 'unprocessed'

interface ApiResume {
  id: string
  filename: string
  uploadedAt: string
  status: 'processed' | 'unprocessed'
  matchScore: number | null
  candidateId: string | null
  errorReason: string | null
}

interface ApiResumeList {
  data: ApiResume[]
}

// ── Frontend shape ────────────────────────────────────────────────────────────

export interface Resume {
  id: string
  filename: string
  uploadedAt: string
  status: 'processed' | 'unprocessed'
  matchScore: number | null
  candidateId: string | null
  errorReason: string | null
}

function mapResume(raw: ApiResume): Resume {
  return {
    id: raw.id,
    filename: raw.filename,
    uploadedAt: raw.uploadedAt,
    status: raw.status,
    matchScore: raw.matchScore,
    candidateId: raw.candidateId,
    errorReason: raw.errorReason,
  }
}

export async function getResumes(jobId: string): Promise<Resume[]> {
  const raw = await apiFetch<ApiResumeList>(`/resumes?jobId=${jobId}`)
  return raw.data.map(mapResume)
}
