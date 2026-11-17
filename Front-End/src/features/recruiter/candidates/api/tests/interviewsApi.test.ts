import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getInterviewsByCandidate,
  getInterviewsByInterviewer,
  createInterview,
  getUpcomingInterviews,
  submitInterviewFeedback,
} from '../interviewsApi'

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

describe('interviewsApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('getInterviewsByCandidate GETs /interviews/candidate/:id with jobId query', async () => {
    fetchSpy.mockResolvedValue(ok([{ interviewId: 'i1' }]))
    const result = await getInterviewsByCandidate('c1', 'j1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/interviews/candidate/c1?jobId=j1')
    expect(result[0].interviewId).toBe('i1')
  })

  it('getInterviewsByInterviewer GETs /interviews/interviewer/:id', async () => {
    fetchSpy.mockResolvedValue(ok([{ interviewId: 'i1', candidateName: 'Alice' }]))
    const result = await getInterviewsByInterviewer('iv1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/interviews/interviewer/iv1')
    expect(result[0].candidateName).toBe('Alice')
  })

  it('createInterview POSTs body to /interviews', async () => {
    fetchSpy.mockResolvedValue(ok({ interviewId: 'i1' }))
    const dto = {
      candidateId: 'c1',
      jobId: 'j1',
      interviewerId: 'iv1',
      scheduledAt: '2026-06-01T10:00:00Z',
      interviewType: 'Technical',
      interviewRound: 1,
      roundName: 'Tech Round 1',
      interviewMode: 'online' as const,
    }
    await createInterview(dto)
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/interviews')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(dto)
  })

  it('getUpcomingInterviews defaults hours=24', async () => {
    fetchSpy.mockResolvedValue(ok({ count: 0, nextInterviewAt: null, nextCandidateName: null }))
    await getUpcomingInterviews()
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/interviews/upcoming?hours=24')
  })

  it('getUpcomingInterviews accepts a custom hours value', async () => {
    fetchSpy.mockResolvedValue(ok({ count: 0, nextInterviewAt: null, nextCandidateName: null }))
    await getUpcomingInterviews(72)
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/interviews/upcoming?hours=72')
  })

  it('submitInterviewFeedback POSTs to /interviews/:id/feedback', async () => {
    fetchSpy.mockResolvedValue(ok({ interviewId: 'i1', overallRating: 5 }))
    const dto = { overallRating: 5, recommendation: 'hire', feedbackNotes: 'great' }
    await submitInterviewFeedback('i1', dto)
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/interviews/i1/feedback')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(dto)
  })
})
