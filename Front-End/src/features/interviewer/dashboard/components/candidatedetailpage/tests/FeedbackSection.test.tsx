import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FeedbackSection } from '../FeedbackSection'
import type { InterviewWithDetails } from '../../../../../recruiter/candidates/api/interviewsApi'

vi.mock('../../../../../recruiter/candidates/api/interviewsApi', async () => {
  const actual = await vi.importActual<typeof import('../../../../../recruiter/candidates/api/interviewsApi')>('../../../../../recruiter/candidates/api/interviewsApi')
  return { ...actual, submitInterviewFeedback: vi.fn() }
})

import { submitInterviewFeedback } from '../../../../../recruiter/candidates/api/interviewsApi'

function withQc(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

function makeIv(overrides: Partial<InterviewWithDetails> = {}): InterviewWithDetails {
  return {
    interviewId: 'i1', candidateId: 'c1', jobId: 'j1', interviewerId: 'iv1',
    scheduledAt: '', durationMinutes: 60,
    interviewType: 'Technical', interviewRound: 1, roundName: '',
    meetingLink: null, location: null, status: 'Scheduled',
    overallRating: null, recommendation: null, feedbackNotes: null,
    noShowReason: null, rescheduleCount: 0,
    createdAt: '', updatedAt: '',
    candidateName: 'Alice', candidateRole: null,
    candidateMatchScore: null, candidateAvatarUrl: null, candidateSkills: null,
    jobTitle: null,
    ...overrides,
  }
}

describe('FeedbackSection', () => {
  beforeEach(() => {
    vi.mocked(submitInterviewFeedback).mockReset()
  })

  it('renders the form when not yet submitted', () => {
    withQc(<FeedbackSection interview={makeIv()} onSuccess={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Submit Feedback' })).toBeInTheDocument()
  })

  it('renders the read-only "Feedback Submitted" view when alreadySubmitted', () => {
    withQc(<FeedbackSection interview={makeIv({ overallRating: 4, recommendation: 'Hire' })} onSuccess={vi.fn()} />)
    expect(screen.getByText('Feedback Submitted')).toBeInTheDocument()
    expect(screen.getByText('Hire')).toBeInTheDocument()
  })

  it('renders the feedback notes quote when present', () => {
    withQc(<FeedbackSection interview={makeIv({ overallRating: 4, recommendation: 'Hire', feedbackNotes: 'Great fit.' })} onSuccess={vi.fn()} />)
    expect(screen.getByText('"Great fit."')).toBeInTheDocument()
  })

  it('submits via mutation and shows success view', async () => {
    vi.mocked(submitInterviewFeedback).mockResolvedValue(makeIv())
    withQc(<FeedbackSection interview={makeIv()} onSuccess={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: '4' }))
    await userEvent.selectOptions(screen.getByRole('combobox'), 'Hire')
    await userEvent.type(screen.getByPlaceholderText('Add interview notes…'), 'good')
    await userEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }))
    await waitFor(() => expect(screen.getByText('Feedback submitted')).toBeInTheDocument())
  })
})
