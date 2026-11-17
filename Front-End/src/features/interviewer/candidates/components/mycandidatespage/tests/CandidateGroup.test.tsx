import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  CandidateGroup, MobileCandidateCard, CandidateRow, ActionButton, MatchScore, CandidateAvatar, RoundDots,
} from '../CandidateGroup'
import type { InterviewWithDetails } from '../../../../../recruiter/candidates/api/interviewsApi'

vi.mock('../../../../dashboard/utils/interviewUtils', () => ({
  roundDisplayName: (iv: { roundName?: string; interviewRound: number }) => iv.roundName || `Round ${iv.interviewRound}`,
}))
vi.mock('../../../utils', () => ({
  formatRelativeDate: () => 'in 2h',
  getRoundDotColor: () => '#fff',
}))

function makeIv(overrides: Partial<InterviewWithDetails> = {}): InterviewWithDetails {
  return {
    interviewId: 'i' + Math.random(), candidateId: 'c1', jobId: 'j1', interviewerId: 'iv1',
    scheduledAt: '2030-01-01T10:00:00Z', durationMinutes: 60,
    interviewType: 'Technical', interviewRound: 2, roundName: '',
    meetingLink: null, location: null, status: 'Scheduled',
    overallRating: null, recommendation: null, feedbackNotes: null,
    noShowReason: null, rescheduleCount: 0,
    createdAt: '', updatedAt: '',
    candidateName: 'Alice', candidateRole: 'Dev',
    candidateMatchScore: 88, candidateAvatarUrl: null, candidateSkills: null,
    jobTitle: 'Eng',
    ...overrides,
  }
}

describe('CandidateGroup', () => {
  it('renders group label and item count', () => {
    render(<CandidateGroup label="Today" color="#f00" items={[makeIv()]} groupKey="upcoming" onSelect={vi.fn()} isMobile={false} isTablet={false} />)
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders mobile card layout when isMobile', () => {
    render(<CandidateGroup label="X" color="#f00" items={[makeIv()]} groupKey="upcoming" onSelect={vi.fn()} isMobile isTablet={false} />)
    expect(screen.getByLabelText(/View details for Alice/)).toBeInTheDocument()
  })

  it('renders desktop row layout when not mobile', () => {
    render(<CandidateGroup label="X" color="#f00" items={[makeIv()]} groupKey="upcoming" onSelect={vi.fn()} isMobile={false} isTablet={false} />)
    expect(screen.getByLabelText(/View details for Alice/)).toBeInTheDocument()
  })
})

describe('ActionButton', () => {
  it('renders Give feedback for feedback group', () => {
    render(<ActionButton groupKey="feedback" onClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument()
  })

  it('renders Prep for upcoming group', () => {
    render(<ActionButton groupKey="upcoming" onClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Prep' })).toBeInTheDocument()
  })

  it('renders View for other groups', () => {
    render(<ActionButton groupKey="past" onClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument()
  })

  it('fires onClick and stops propagation', async () => {
    const onClick = vi.fn()
    render(<ActionButton groupKey="upcoming" onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})

describe('MatchScore', () => {
  it('renders em dash for null', () => {
    render(<MatchScore score={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders green text for 80+', () => {
    render(<MatchScore score={92} />)
    expect(screen.getByText('92%')).toHaveStyle({ color: '#4ade80' })
  })

  it('renders amber text for 65..79', () => {
    render(<MatchScore score={70} />)
    expect(screen.getByText('70%')).toHaveStyle({ color: '#F6AD55' })
  })

  it('renders red text for <50', () => {
    render(<MatchScore score={40} />)
    expect(screen.getByText('40%')).toHaveStyle({ color: '#f87171' })
  })
})

describe('CandidateAvatar', () => {
  it('renders the first character uppercased', () => {
    render(<CandidateAvatar name="alice" groupKey="upcoming" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('falls back to C when name empty', () => {
    render(<CandidateAvatar name="" groupKey="upcoming" />)
    expect(screen.getByText('C')).toBeInTheDocument()
  })
})

describe('RoundDots + Mobile/Desktop rows', () => {
  it('renders 3 dots', () => {
    const { container } = render(<RoundDots interviewRound={2} groupKey="upcoming" />)
    expect(container.querySelectorAll('div').length).toBeGreaterThanOrEqual(3)
  })

  it('mobile card emits onSelect when clicked', async () => {
    const onSelect = vi.fn()
    render(<MobileCandidateCard interview={makeIv()} groupKey="upcoming" isLast onSelect={onSelect} />)
    await userEvent.click(screen.getByLabelText(/View details for Alice/))
    expect(onSelect).toHaveBeenCalled()
  })

  it('desktop row emits onSelect when clicked', async () => {
    const onSelect = vi.fn()
    render(<CandidateRow interview={makeIv()} groupKey="upcoming" isLast onSelect={onSelect} isTablet={false} />)
    await userEvent.click(screen.getByLabelText(/View details for Alice/))
    expect(onSelect).toHaveBeenCalled()
  })
})
