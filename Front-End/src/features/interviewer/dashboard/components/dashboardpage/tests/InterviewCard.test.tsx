import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InterviewCard } from '../InterviewCard'
import type { InterviewWithDetails } from '../../../../../recruiter/candidates/api/interviewsApi'

vi.mock('../../../utils/dateUtils', () => ({
  isLive: () => false,
  fmt12: () => '10:00 AM',
  fmtDate: () => 'May 25',
  timeAgo: () => '1d ago',
  getWeekDays: () => [],
}))

vi.mock('../../../utils/interviewUtils', () => ({
  roundDisplayName: (iv: { roundName?: string; interviewRound: number }) => iv.roundName || `Round ${iv.interviewRound}`,
  resolveTypeLabel: (s: string) => s,
}))

function makeInterview(overrides: Partial<InterviewWithDetails> = {}): InterviewWithDetails {
  return {
    interviewId: 'i1', candidateId: 'c1', jobId: 'j1', interviewerId: 'iv1',
    scheduledAt: '2030-12-31T10:00:00Z', durationMinutes: 60,
    interviewType: 'Technical', interviewRound: 2, roundName: '',
    meetingLink: null, location: null, status: 'Scheduled',
    overallRating: null, recommendation: null, feedbackNotes: null,
    noShowReason: null, rescheduleCount: 0,
    createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z',
    candidateName: 'Alice Doe', candidateRole: 'Dev',
    candidateMatchScore: 88, candidateAvatarUrl: null, candidateSkills: null,
    jobTitle: 'Engineer',
    ...overrides,
  }
}

describe('InterviewCard', () => {
  it('renders candidate name, round, type, job title', () => {
    render(<InterviewCard interview={makeInterview()} onClick={vi.fn()} />)
    expect(screen.getByText('Alice Doe')).toBeInTheDocument()
    expect(screen.getByText('Round 2')).toBeInTheDocument()
    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.getByText('Engineer')).toBeInTheDocument()
  })

  it('renders initials in avatar', () => {
    const { container } = render(<InterviewCard interview={makeInterview()} onClick={vi.fn()} />)
    expect(container.textContent).toContain('A')
  })

  it('fallback to "Candidate" when candidateName null', () => {
    render(<InterviewCard interview={makeInterview({ candidateName: null })} onClick={vi.fn()} />)
    expect(screen.getByText('Candidate')).toBeInTheDocument()
  })

  it('shows "Upcoming" status when scheduled in future', () => {
    render(<InterviewCard interview={makeInterview()} onClick={vi.fn()} />)
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
  })

  it('shows "Feedback Pending" when Completed + no rating', () => {
    render(<InterviewCard interview={makeInterview({ status: 'Completed' })} onClick={vi.fn()} />)
    expect(screen.getByText('Feedback Pending')).toBeInTheDocument()
  })

  it('shows "Done" when Completed + rating provided', () => {
    render(<InterviewCard interview={makeInterview({ status: 'Completed', overallRating: 4 })} onClick={vi.fn()} />)
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('fires onClick', async () => {
    const onClick = vi.fn()
    render(<InterviewCard interview={makeInterview()} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
