import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { InterviewFeedbackCard } from '../InterviewFeedbackCard'
import type { Interview } from '../../../api/interviewsApi'

vi.mock('../../../api/interviewsApi', async () => {
  const actual = await vi.importActual<typeof import('../../../api/interviewsApi')>('../../../api/interviewsApi')
  return { ...actual, getInterviewsByCandidate: vi.fn() }
})

import { getInterviewsByCandidate } from '../../../api/interviewsApi'

function withQc(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

function makeIv(overrides: Partial<Interview> = {}): Interview {
  return {
    interviewId: 'i1', candidateId: 'c1', jobId: 'j1', interviewerId: 'iv1',
    scheduledAt: '2026-06-01T10:00:00Z', durationMinutes: 60,
    interviewType: 'Technical', interviewRound: 1, roundName: '',
    meetingLink: null, location: null, status: 'Scheduled',
    overallRating: null, recommendation: null, feedbackNotes: null,
    noShowReason: null, rescheduleCount: 0,
    createdAt: '2026-06-01T08:00:00Z', updatedAt: '2026-06-01T08:00:00Z',
    ...overrides,
  }
}

async function openCard(candidateId = 'c1') {
  withQc(<InterviewFeedbackCard candidateId={candidateId} jobId="j1" />)
  await userEvent.click(screen.getByRole('button', { name: /interview feedback/i }))
}

describe('InterviewFeedbackCard', () => {
  beforeEach(() => {
    vi.mocked(getInterviewsByCandidate).mockReset()
  })

  it('renders the toggle button', () => {
    vi.mocked(getInterviewsByCandidate).mockResolvedValue([])
    withQc(<InterviewFeedbackCard candidateId="c1" jobId="j1" />)
    expect(screen.getByRole('button', { name: /interview feedback/i })).toBeInTheDocument()
  })

  it('shows empty state message when no interviews', async () => {
    vi.mocked(getInterviewsByCandidate).mockResolvedValue([])
    await openCard()
    await waitFor(() => {
      expect(screen.getByText('No interviews scheduled yet.')).toBeInTheDocument()
    })
  })

  it('shows one tab per unique round when no duplicates', async () => {
    vi.mocked(getInterviewsByCandidate).mockResolvedValue([
      makeIv({ interviewId: 'i1', interviewRound: 1 }),
      makeIv({ interviewId: 'i2', interviewRound: 2 }),
    ])
    await openCard()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /round 1/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /round 2/i })).toBeInTheDocument()
    })
  })

  it('deduplicates — shows one tab when two rows share the same interviewRound', async () => {
    vi.mocked(getInterviewsByCandidate).mockResolvedValue([
      makeIv({ interviewId: 'i1', interviewRound: 2, createdAt: '2026-06-01T08:00:00Z' }),
      makeIv({ interviewId: 'i2', interviewRound: 2, createdAt: '2026-06-01T09:00:00Z' }),
    ])
    await openCard()
    await waitFor(() => {
      const tabs = screen.getAllByRole('button', { name: /round 2/i })
      expect(tabs).toHaveLength(1)
    })
  })

  it('keeps the most recently created row when deduplicating', async () => {
    vi.mocked(getInterviewsByCandidate).mockResolvedValue([
      makeIv({ interviewId: 'older', interviewRound: 1, roundName: 'Technical', createdAt: '2026-06-01T08:00:00Z' }),
      makeIv({ interviewId: 'newer', interviewRound: 1, roundName: 'Technical Revised', createdAt: '2026-06-01T12:00:00Z' }),
    ])
    await openCard()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /technical revised/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^technical$/i })).toBeNull()
    })
  })

  it('shows awaiting feedback message for scheduled round', async () => {
    vi.mocked(getInterviewsByCandidate).mockResolvedValue([
      makeIv({ interviewId: 'i1', interviewRound: 1, status: 'Scheduled' }),
    ])
    await openCard()
    await waitFor(() => {
      expect(screen.getByText(/awaiting feedback/i)).toBeInTheDocument()
    })
  })

  it('shows submitted feedback view when overallRating is set', async () => {
    vi.mocked(getInterviewsByCandidate).mockResolvedValue([
      makeIv({ interviewId: 'i1', interviewRound: 1, status: 'Completed', overallRating: 4, recommendation: 'Hire' }),
    ])
    // Card auto-opens when reviewed feedback is present — no click needed
    withQc(<InterviewFeedbackCard candidateId="c1" jobId="j1" />)
    await waitFor(() => {
      expect(screen.getByText('Hire')).toBeInTheDocument()
    })
  })
})
