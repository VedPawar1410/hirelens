import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CandidateDetailPage from '../CandidateDetailPage'
import type { CandidateDetail } from '../../../../../shared/types/index'

const navigateMock = vi.fn()
let mockParams = { candidateId: 'c1' }
let mockSearch: Record<string, unknown> = { jobId: 'j1' }

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
  useParams: () => mockParams,
  useSearch: () => mockSearch,
}))
vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({ isTiny: false, isMobile: false, isCompact: false, isTablet: false, isCompactTablet: false, isDesktop: true }),
}))
vi.mock('../../../../../shared/hooks/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))
vi.mock('../../api/candidatesApi', () => ({
  getCandidateById: vi.fn(),
  moveToNextStage: vi.fn(), moveToPreviousStage: vi.fn(),
  shortlistCandidate: vi.fn(), rejectCandidate: vi.fn(),
}))
vi.mock('../../../jd-creation/api/jdApi', () => ({ getDraftById: vi.fn() }))
// Stub the two cards that depend on extra hooks/queries
vi.mock('../../components/candidatedetailpage/ScheduleInterviewCard', () => ({ ScheduleInterviewCard: () => <div data-testid="schedule-card" /> }))
vi.mock('../../components/candidatedetailpage/InterviewFeedbackCard', () => ({ InterviewFeedbackCard: () => <div data-testid="feedback-card" /> }))

import { getCandidateById } from '../../api/candidatesApi'

const candidate: CandidateDetail = {
  id: 'c1', name: 'Alice', currentRole: 'Dev', avatarUrl: null,
  matchScore: 88, isDuplicate: false,
  appliedJob: null, applicationSource: 'Direct Upload',
  status: 'shortlisted', appliedDate: '2026-01-01',
  email: null, phone: null, linkedIn: null, gitHub: null,
  skills: ['ts'], experience: 5, education: 'B.S.',
  skippedRounds: [],
  resumeBase64: null, jobDescBase64: null, resumeFileName: null, jobDescFileName: null,
}

function renderPage(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('Recruiter CandidateDetailPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    mockParams = { candidateId: 'c1' }
    mockSearch = { jobId: 'j1' }
    vi.mocked(getCandidateById).mockReset()
  })

  it('shows loading state initially', () => {
    vi.mocked(getCandidateById).mockReturnValue(new Promise(() => undefined))
    renderPage(<CandidateDetailPage />)
    expect(screen.getByText('Loading candidate…')).toBeInTheDocument()
  })

  it('renders candidate detail once loaded', async () => {
    vi.mocked(getCandidateById).mockResolvedValue(candidate)
    renderPage(<CandidateDetailPage />)
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
    expect(screen.getByText('AI Analysis Engine')).toBeInTheDocument()
    expect(screen.getByTestId('schedule-card')).toBeInTheDocument()
    expect(screen.getByTestId('feedback-card')).toBeInTheDocument()
  })

  it('shows "no job context" message when jobId missing', async () => {
    mockSearch = {}
    renderPage(<CandidateDetailPage />)
    await waitFor(() => expect(screen.getByText(/No job context/)).toBeInTheDocument())
  })

  it('shows not-found message when query resolves null', async () => {
    vi.mocked(getCandidateById).mockResolvedValue(null!)
    renderPage(<CandidateDetailPage />)
    await waitFor(() => expect(screen.getByText('Candidate not found.')).toBeInTheDocument())
  })

  it('back button navigates to candidates list when not from job folder', async () => {
    vi.mocked(getCandidateById).mockResolvedValue(candidate)
    renderPage(<CandidateDetailPage />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /Back to Candidates/ }))
    expect(navigateMock).toHaveBeenCalledWith({ to: '/recruitment/candidates', search: { status: undefined, filter: undefined } })
  })
})
