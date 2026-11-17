import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatsPanel } from '../StatsPanel'
import type { InterviewWithDetails } from '../../../../../recruiter/candidates/api/interviewsApi'

vi.mock('../../../utils/dateUtils', () => ({
  timeAgo: () => '2d ago',
}))
vi.mock('../../../utils/interviewUtils', () => ({
  roundDisplayName: (iv: { roundName?: string; interviewRound: number }) => iv.roundName || `Round ${iv.interviewRound}`,
}))

function iv(overrides: Partial<InterviewWithDetails> = {}): InterviewWithDetails {
  const now = new Date()
  return {
    interviewId: 'i' + Math.random(), candidateId: 'c1', jobId: 'j1', interviewerId: 'iv1',
    scheduledAt: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
    durationMinutes: 60,
    interviewType: 'Technical', interviewRound: 1, roundName: '',
    meetingLink: null, location: null, status: 'Completed',
    overallRating: 4, recommendation: 'Hire', feedbackNotes: 'good',
    noShowReason: null, rescheduleCount: 0,
    createdAt: '', updatedAt: new Date().toISOString(),
    candidateName: 'Alice', candidateRole: null,
    candidateMatchScore: null, candidateAvatarUrl: null, candidateSkills: null,
    jobTitle: 'Eng',
    ...overrides,
  }
}

describe('StatsPanel', () => {
  it('renders YOUR STATS section', () => {
    render(<StatsPanel interviews={[]} nextInterview={null} onOpenCandidate={vi.fn()} />)
    expect(screen.getByText('Your Stats')).toBeInTheDocument()
    expect(screen.getByText('This month')).toBeInTheDocument()
    expect(screen.getByText('Avg rating given')).toBeInTheDocument()
  })

  it('renders 0 stats when no interviews', () => {
    render(<StatsPanel interviews={[]} nextInterview={null} onOpenCandidate={vi.fn()} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('computes avg rating when interviews have ratings', () => {
    render(<StatsPanel interviews={[iv({ overallRating: 4 }), iv({ overallRating: 5 })]} nextInterview={null} onOpenCandidate={vi.fn()} />)
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('renders Recent Activity when feedback exists', () => {
    render(<StatsPanel interviews={[iv()]} nextInterview={null} onOpenCandidate={vi.fn()} />)
    expect(screen.getByText('Recent activity')).toBeInTheDocument()
    expect(screen.getByText(/Submitted feedback for Alice/)).toBeInTheDocument()
  })

  it('shows default prep tip when no nextInterview', () => {
    render(<StatsPanel interviews={[]} nextInterview={null} onOpenCandidate={vi.fn()} />)
    expect(screen.getByText(/Take notes during the interview/)).toBeInTheDocument()
  })

  it('shows targeted prep tip when nextInterview exists', () => {
    const next = iv({ candidateName: 'Bob Smith', jobTitle: 'Senior Eng' })
    render(<StatsPanel interviews={[]} nextInterview={next} onOpenCandidate={vi.fn()} />)
    expect(screen.getByText(/Senior Eng/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open candidate' })).toBeInTheDocument()
  })

  it('fires onOpenCandidate when "Open candidate" pressed', async () => {
    const onOpen = vi.fn()
    const next = iv({ candidateName: 'Bob' })
    render(<StatsPanel interviews={[]} nextInterview={next} onOpenCandidate={onOpen} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open candidate' }))
    expect(onOpen).toHaveBeenCalledWith(next)
  })
})
