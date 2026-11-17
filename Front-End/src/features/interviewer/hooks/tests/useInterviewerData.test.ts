import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useInterviewerData } from '../useInterviewerData'
import type { InterviewWithDetails } from '../../../recruiter/candidates/api/interviewsApi'

vi.mock('../../../recruiter/candidates/api/interviewsApi', async () => {
  const actual = await vi.importActual<typeof import('../../../recruiter/candidates/api/interviewsApi')>('../../../recruiter/candidates/api/interviewsApi')
  return { ...actual, getInterviewsByInterviewer: vi.fn() }
})

import { getInterviewsByInterviewer } from '../../../recruiter/candidates/api/interviewsApi'

function makeIv(overrides: Partial<InterviewWithDetails> = {}): InterviewWithDetails {
  return {
    interviewId: 'i1', candidateId: 'c1', jobId: 'j1', interviewerId: 'iv1',
    scheduledAt: '2026-06-04T10:00:00Z', durationMinutes: 60,
    interviewType: 'Technical', interviewRound: 1, roundName: 'Tech Round 1',
    meetingLink: null, location: null, status: 'Scheduled',
    overallRating: null, recommendation: null, feedbackNotes: null,
    noShowReason: null, rescheduleCount: 0,
    createdAt: '2026-06-01T08:00:00Z', updatedAt: '2026-06-01T08:00:00Z',
    candidateName: 'Alice', candidateRole: 'Dev',
    candidateMatchScore: 88, candidateAvatarUrl: null, candidateSkills: null,
    jobTitle: 'Eng',
    ...overrides,
  }
}

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useInterviewerData', () => {
  beforeEach(() => vi.mocked(getInterviewsByInterviewer).mockReset())

  it('returns empty array while userId is undefined', () => {
    vi.mocked(getInterviewsByInterviewer).mockResolvedValue([])
    const { result } = renderHook(() => useInterviewerData(undefined), { wrapper })
    expect(result.current.interviews).toEqual([])
  })

  it('returns all interviews when there are no duplicates', async () => {
    vi.mocked(getInterviewsByInterviewer).mockResolvedValue([
      makeIv({ interviewId: 'i1', candidateId: 'c1', interviewRound: 1 }),
      makeIv({ interviewId: 'i2', candidateId: 'c1', interviewRound: 2 }),
      makeIv({ interviewId: 'i3', candidateId: 'c2', interviewRound: 1 }),
    ])
    const { result } = renderHook(() => useInterviewerData('iv1'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.interviews).toHaveLength(3)
  })

  it('deduplicates to one row and keeps the most recently created', async () => {
    vi.mocked(getInterviewsByInterviewer).mockResolvedValue([
      makeIv({ interviewId: 'older', candidateId: 'c1', interviewRound: 2, createdAt: '2026-06-01T08:00:00Z' }),
      makeIv({ interviewId: 'newer', candidateId: 'c1', interviewRound: 2, createdAt: '2026-06-01T10:00:00Z' }),
    ])
    const { result } = renderHook(() => useInterviewerData('iv1'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.interviews).toHaveLength(1)
    expect(result.current.interviews[0].interviewId).toBe('newer')
  })

  it('does not cross-deduplicate rows from different candidates for the same round number', async () => {
    vi.mocked(getInterviewsByInterviewer).mockResolvedValue([
      makeIv({ interviewId: 'i1', candidateId: 'c1', interviewRound: 1 }),
      makeIv({ interviewId: 'i2', candidateId: 'c2', interviewRound: 1 }),
    ])
    const { result } = renderHook(() => useInterviewerData('iv1'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.interviews).toHaveLength(2)
  })
})
