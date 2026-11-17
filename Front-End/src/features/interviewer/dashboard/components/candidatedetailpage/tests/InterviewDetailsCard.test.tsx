import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InterviewDetailsCard } from '../InterviewDetailsCard'
import type { InterviewWithDetails } from '../../../../../recruiter/candidates/api/interviewsApi'

vi.mock('../../../utils/dateUtils', () => ({ fmt12: () => '10:00 AM' }))
vi.mock('../../../utils/interviewUtils', () => ({
  roundDisplayName: (iv: { roundName?: string; interviewRound: number }) => iv.roundName || `Round ${iv.interviewRound}`,
  resolveTypeLabel: (s: string) => s,
}))

function makeIv(overrides: Partial<InterviewWithDetails> = {}): InterviewWithDetails {
  return {
    interviewId: 'i1', candidateId: 'c1', jobId: 'j1', interviewerId: 'iv1',
    scheduledAt: '2026-05-25T10:00:00Z', durationMinutes: 45,
    interviewType: 'Technical', interviewRound: 2, roundName: '',
    meetingLink: null, location: null, status: 'Scheduled',
    overallRating: null, recommendation: null, feedbackNotes: null,
    noShowReason: null, rescheduleCount: 0,
    createdAt: '', updatedAt: '',
    candidateName: null, candidateRole: null,
    candidateMatchScore: null, candidateAvatarUrl: null, candidateSkills: null,
    jobTitle: null,
    ...overrides,
  }
}

describe('InterviewDetailsCard', () => {
  it('hides the LIVE pill when the interview is not live', () => {
    render(<InterviewDetailsCard interview={makeIv()} live={false} />)
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
  })

  it('renders Round, Format, Duration', () => {
    render(<InterviewDetailsCard interview={makeIv()} live={false} />)
    expect(screen.getByText('Round 2')).toBeInTheDocument()
    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.getByText('45 min')).toBeInTheDocument()
  })

  it('renders LIVE pill when live=true', () => {
    render(<InterviewDetailsCard interview={makeIv()} live />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('renders Join Call when meetingLink present', () => {
    render(<InterviewDetailsCard interview={makeIv({ meetingLink: 'https://meet.example.com/x' })} live={false} />)
    expect(screen.getByText(/Join Call/)).toBeInTheDocument()
  })

  it('renders location when meetingLink missing but location set', () => {
    render(<InterviewDetailsCard interview={makeIv({ location: 'Floor 5' })} live={false} />)
    expect(screen.getByText('Floor 5')).toBeInTheDocument()
  })
})
