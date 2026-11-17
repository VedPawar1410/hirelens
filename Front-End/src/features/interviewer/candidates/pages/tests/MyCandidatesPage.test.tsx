import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MyCandidatesPage from '../MyCandidatesPage'
import type { InterviewWithDetails } from '../../../../recruiter/candidates/api/interviewsApi'

const navigateMock = vi.fn()
const mockUseInterviewerData = vi.fn()

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigateMock }))
vi.mock('../../../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1', username: 'iv1', role: 'interviewer', name: 'Ivy' } }),
}))
vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({ isTiny: false, isMobile: false, isCompact: false, isTablet: false, isCompactTablet: false, isDesktop: true }),
}))
vi.mock('../../../hooks/useInterviewerData', () => ({
  useInterviewerData: () => mockUseInterviewerData(),
}))
vi.mock('../../../dashboard/hooks/useInterviewDetailModal', () => ({
  useInterviewDetailModal: () => ({
    selectedInterview: null, feedbackKey: 0,
    openInterview: vi.fn(), closeInterview: vi.fn(), handleFeedbackSuccess: vi.fn(),
  }),
}))

let interviewSeq = 0

function iv(overrides: Partial<InterviewWithDetails> = {}): InterviewWithDetails {
  const future = new Date(Date.now() + 86_400_000).toISOString()
  return {
    interviewId: 'i' + interviewSeq++, candidateId: 'c1', jobId: 'j1', interviewerId: 'iv1',
    scheduledAt: future, durationMinutes: 60,
    interviewType: 'Technical', interviewRound: 1, roundName: '',
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

function renderPage(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('MyCandidatesPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    mockUseInterviewerData.mockReset()
  })

  it('renders the heading + filter chips', () => {
    mockUseInterviewerData.mockReturnValue({ interviews: [], isLoading: false })
    renderPage(<MyCandidatesPage />)
    expect(screen.getByRole('heading', { name: 'My Candidates' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /All/ })).toBeInTheDocument()
  })

  it('renders empty state when no interviews match', () => {
    mockUseInterviewerData.mockReturnValue({ interviews: [], isLoading: false })
    renderPage(<MyCandidatesPage />)
    expect(screen.getByText('No candidates match this filter')).toBeInTheDocument()
  })

  it('renders loading spinner while loading', () => {
    mockUseInterviewerData.mockReturnValue({ interviews: [], isLoading: true })
    const { container } = renderPage(<MyCandidatesPage />)
    expect(container.querySelector('.btn-spinner')).toBeTruthy()
  })

  it('renders candidate groups when data present', () => {
    mockUseInterviewerData.mockReturnValue({ interviews: [iv()], isLoading: false })
    renderPage(<MyCandidatesPage />)
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
  })

  it('filters when a chip is clicked', async () => {
    mockUseInterviewerData.mockReturnValue({ interviews: [iv()], isLoading: false })
    renderPage(<MyCandidatesPage />)
    await userEvent.click(screen.getByRole('button', { name: /Past/ }))
    // upcoming interview should now be hidden under the Past filter
    expect(screen.getByText('No candidates match this filter')).toBeInTheDocument()
  })

  it('shows a missed (past, never-taken) scheduled interview under Past – no action', async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString()
    mockUseInterviewerData.mockReturnValue({
      interviews: [iv({ scheduledAt: past, status: 'Scheduled', overallRating: null })],
      isLoading: false,
    })
    renderPage(<MyCandidatesPage />)
    // visible under the default "All" filter — not silently dropped
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
    // and still present after selecting the "Past" filter
    await userEvent.click(screen.getByRole('button', { name: /Past/ }))
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
    expect(screen.queryByText('No candidates match this filter')).not.toBeInTheDocument()
  })

  it('Schedule view button navigates to dashboard', async () => {
    mockUseInterviewerData.mockReturnValue({ interviews: [], isLoading: false })
    renderPage(<MyCandidatesPage />)
    await userEvent.click(screen.getByRole('button', { name: /Schedule view/ }))
    expect(navigateMock).toHaveBeenCalledWith({ to: '/interviewer/dashboard' })
  })
})
