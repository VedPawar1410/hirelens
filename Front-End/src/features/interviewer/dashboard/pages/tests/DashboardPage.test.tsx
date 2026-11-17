import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from '../DashboardPage'
import type { InterviewWithDetails } from '../../../../recruiter/candidates/api/interviewsApi'

const mockUseInterviewerData = vi.fn()

vi.mock('../../../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1', username: 'iv1', role: 'interviewer', name: 'Ivy Vue' } }),
}))
vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({ isTiny: false, isMobile: false, isCompact: false, isTablet: false, isCompactTablet: false, isDesktop: true }),
}))
vi.mock('../../../hooks/useInterviewerData', () => ({
  useInterviewerData: () => mockUseInterviewerData(),
}))
vi.mock('../../hooks/useInterviewDetailModal', () => ({
  useInterviewDetailModal: () => ({
    selectedInterview: null, feedbackKey: 0,
    openInterview: vi.fn(), closeInterview: vi.fn(), handleFeedbackSuccess: vi.fn(),
  }),
}))

function iv(overrides: Partial<InterviewWithDetails> = {}): InterviewWithDetails {
  return {
    interviewId: 'i1', candidateId: 'c1', jobId: 'j1', interviewerId: 'iv1',
    scheduledAt: new Date().toISOString(), durationMinutes: 60,
    interviewType: 'Technical', interviewRound: 1, roundName: 'Tech Round 1',
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

describe('Interviewer DashboardPage', () => {
  beforeEach(() => mockUseInterviewerData.mockReset())

  it('renders greeting with first name + Interview Panel pill', () => {
    mockUseInterviewerData.mockReturnValue({ interviews: [], isLoading: false })
    render(<DashboardPage />)
    expect(screen.getByText('Interview Panel')).toBeInTheDocument()
    expect(screen.getByText(/Ivy/)).toBeInTheDocument()
  })

  it('renders the 4 stat labels', () => {
    mockUseInterviewerData.mockReturnValue({ interviews: [], isLoading: false })
    render(<DashboardPage />)
    expect(screen.getByText('Total Assigned')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Feedback Due')).toBeInTheDocument()
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
  })

  it('shows empty state when no interviews', () => {
    mockUseInterviewerData.mockReturnValue({ interviews: [], isLoading: false })
    render(<DashboardPage />)
    expect(screen.getByText('No interviews assigned yet')).toBeInTheDocument()
  })

  it('renders interview cards when data present', () => {
    mockUseInterviewerData.mockReturnValue({ interviews: [iv()], isLoading: false })
    render(<DashboardPage />)
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
  })

  it('renders loading spinner while isLoading', () => {
    mockUseInterviewerData.mockReturnValue({ interviews: [], isLoading: true })
    const { container } = render(<DashboardPage />)
    expect(container.querySelector('.btn-spinner')).toBeTruthy()
  })

  it('surfaces a missed (overdue, never-taken) interview under a Needs Action section', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString()
    mockUseInterviewerData.mockReturnValue({
      interviews: [iv({ scheduledAt: past, status: 'Scheduled', overallRating: null })],
      isLoading: false,
    })
    render(<DashboardPage />)
    expect(screen.getByText('Needs Action')).toBeInTheDocument()
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
    expect(screen.queryByText('No interviews assigned yet')).not.toBeInTheDocument()
  })

  it('does not count a missed interview as Feedback Due', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString()
    mockUseInterviewerData.mockReturnValue({
      interviews: [iv({ scheduledAt: past, status: 'Scheduled', overallRating: null })],
      isLoading: false,
    })
    render(<DashboardPage />)
    const feedbackValue = screen.getByText('Feedback Due').previousElementSibling
    expect(feedbackValue?.textContent).toBe('0')
  })
})
