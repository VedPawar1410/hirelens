import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCandidates,
  moveToNextStage,
  moveToPreviousStage,
  shortlistCandidate,
  rejectCandidate,
  getCandidateById,
  assignCandidateToInterviewer,
  getCandidateCounts,
  getCandidateStageCountsByJob,
  subscribeAtsScoreStream,
} from '../candidatesApi'

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function rawCandidate(overrides = {}) {
  return {
    id: 'c1',
    name: 'Alice',
    currentRole: 'Dev',
    avatarUrl: null,
    matchScore: 92,
    isDuplicate: false,
    appliedJob: { id: 'j1', title: 'Eng' },
    applicationSource: 'Direct Upload',
    status: 'under_review',
    appliedDate: '2026-01-01',
    email: 'a@x.com',
    phone: null,
    linkedIn: null,
    gitHub: null,
    skills: ['ts'],
    experience: 3,
    education: 'B.S.',
    ...overrides,
  }
}

describe('getCandidates', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('builds default query string with page=1 limit=50', async () => {
    fetchSpy.mockResolvedValue(ok({ candidates: [], total: 0, page: 1, limit: 50 }))
    await getCandidates()
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/candidates?page=1&limit=50')
  })

  it('appends optional params when provided', async () => {
    fetchSpy.mockResolvedValue(ok({ candidates: [], total: 0, page: 2, limit: 20 }))
    await getCandidates({
      page: 2,
      limit: 20,
      status: 'shortlisted',
      search: 'jane',
      jobId: 'job-1',
      sortBy: 'matchScore',
      sortDir: 'desc',
      minScore: 80,
    })
    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain('page=2')
    expect(url).toContain('limit=20')
    expect(url).toContain('status=shortlisted')
    expect(url).toContain('search=jane')
    expect(url).toContain('jobId=job-1')
    expect(url).toContain('sortBy=matchScore')
    expect(url).toContain('sortDir=desc')
    expect(url).toContain('minScore=80')
  })

  it('maps raw candidates into the Candidate shape', async () => {
    fetchSpy.mockResolvedValue(ok({
      candidates: [rawCandidate()],
      total: 1, page: 1, limit: 50,
    }))
    const result = await getCandidates()
    expect(result.candidates[0]).toEqual(rawCandidate())
    expect(result.total).toBe(1)
  })
})

describe('stage-change endpoints', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('moveToNextStage PATCHes /candidates/:id/stage?jobId=', async () => {
    fetchSpy.mockResolvedValue(ok({ status: '1st_round' }))
    const result = await moveToNextStage('c1', 'j1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/candidates/c1/stage?jobId=j1')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('PATCH')
    expect(result.status).toBe('1st_round')
  })

  it('moveToNextStage omits ?jobId= when not provided', async () => {
    fetchSpy.mockResolvedValue(ok({ status: 'filtered' }))
    await moveToNextStage('c1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/candidates/c1/stage')
  })

  it('shortlistCandidate PATCHes /candidates/:id/shortlist', async () => {
    fetchSpy.mockResolvedValue(ok({ status: 'shortlisted' }))
    await shortlistCandidate('c1', 'j1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/candidates/c1/shortlist?jobId=j1')
  })

  it('moveToPreviousStage PATCHes /candidates/:id/prev-stage', async () => {
    fetchSpy.mockResolvedValue(ok({ status: 'under_review' }))
    await moveToPreviousStage('c1', 'j1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/candidates/c1/prev-stage?jobId=j1')
  })

  it('rejectCandidate PATCHes /candidates/:id/reject', async () => {
    fetchSpy.mockResolvedValue(ok({ status: 'rejected' }))
    await rejectCandidate('c1', 'j1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/candidates/c1/reject?jobId=j1')
  })
})

describe('getCandidateById', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('GETs /candidates/:id/:jobId/detail', async () => {
    fetchSpy.mockResolvedValue(ok({
      ...rawCandidate(),
      resumeBase64: null,
      jobDescBase64: null,
      resumeFileName: null,
      jobDescFileName: null,
    }))
    await getCandidateById('c1', 'j1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/candidates/c1/j1/detail')
  })

  it('rounds matchScore and defaults currentRole/appliedDate', async () => {
    fetchSpy.mockResolvedValue(ok({
      ...rawCandidate({ matchScore: 87.6, currentRole: null, appliedDate: null }),
      resumeBase64: null, jobDescBase64: null, resumeFileName: null, jobDescFileName: null,
    }))
    const result = await getCandidateById('c1', 'j1')
    expect(result.matchScore).toBe(88)
    expect(result.currentRole).toBe('')
    expect(result.appliedDate).toBe('')
  })

  it('preserves null matchScore', async () => {
    fetchSpy.mockResolvedValue(ok({
      ...rawCandidate({ matchScore: null }),
      resumeBase64: null, jobDescBase64: null, resumeFileName: null, jobDescFileName: null,
    }))
    const result = await getCandidateById('c1', 'j1')
    expect(result.matchScore).toBeNull()
  })

  it('falls back to under_review when status is unknown', async () => {
    fetchSpy.mockResolvedValue(ok({
      ...rawCandidate({ status: 'something_else' }),
      resumeBase64: null, jobDescBase64: null, resumeFileName: null, jobDescFileName: null,
    }))
    const result = await getCandidateById('c1', 'j1')
    expect(result.status).toBe('under_review')
  })

  it('falls back to Direct Upload when applicationSource is unknown', async () => {
    fetchSpy.mockResolvedValue(ok({
      ...rawCandidate({ applicationSource: 'bogus' }),
      resumeBase64: null, jobDescBase64: null, resumeFileName: null, jobDescFileName: null,
    }))
    const result = await getCandidateById('c1', 'j1')
    expect(result.applicationSource).toBe('Direct Upload')
  })
})

describe('assignCandidateToInterviewer', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('PATCHes /candidates/:id/assign with interviewerIds body', async () => {
    fetchSpy.mockResolvedValue(ok({ assigned: true }))
    const result = await assignCandidateToInterviewer('c1', ['iv1', 'iv2'])
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/candidates/c1/assign')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ interviewerIds: ['iv1', 'iv2'] })
    expect(result).toEqual({ assigned: true })
  })
})

describe('count endpoints', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('getCandidateCounts GETs /candidates/counts', async () => {
    fetchSpy.mockResolvedValue(ok({ underReview: 1, filtered: 2 }))
    const result = await getCandidateCounts()
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/candidates/counts')
    expect(result.underReview).toBe(1)
  })

  it('getCandidateStageCountsByJob GETs /candidates/job-stage-counts with jobId encoded', async () => {
    fetchSpy.mockResolvedValue(ok({ '1st_round': 3 }))
    await getCandidateStageCountsByJob('job with space')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/candidates/job-stage-counts?jobId=job%20with%20space')
  })
})

describe('subscribeAtsScoreStream', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('connects to /candidates/stream?jobId= and returns a cleanup fn', () => {
    fetchSpy.mockImplementation((_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })
    )
    const cleanup = subscribeAtsScoreStream('j1', () => undefined)
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/candidates/stream?jobId=j1')
    expect(typeof cleanup).toBe('function')
    cleanup()
  })
})
