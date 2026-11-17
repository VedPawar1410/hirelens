import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CandidateDetailPage } from '../CandidateDetailPage'
import type { InterviewWithDetails } from '../../../../recruiter/candidates/api/interviewsApi'
import type { CandidateDetail } from '../../../../../shared/types/index'

vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({ isTiny: false, isMobile: false, isCompact: false, isTablet: false, isCompactTablet: false, isDesktop: true }),
}))
vi.mock('../../../../recruiter/candidates/api/candidatesApi', () => ({ getCandidateById: vi.fn() }))
vi.mock('../../../../recruiter/jd-creation/api/jdApi', () => ({ getDraftById: vi.fn() }))
vi.mock('../../../../../shared/hooks/usePdfBlobUrl', () => ({ usePdfBlobUrl: () => null }))
vi.mock('../../utils/dateUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/dateUtils')>()
  return { ...actual, isLive: () => false }
})
vi.mock('../../components/candidatedetailpage/FeedbackSection', () => ({ FeedbackSection: () => <div data-testid="feedback-section" /> }))

import { getCandidateById } from '../../../../recruiter/candidates/api/candidatesApi'

const interview: InterviewWithDetails = {
  interviewId: 'i1', candidateId: 'c1', jobId: 'j1', interviewerId: 'iv1',
  scheduledAt: '2026-06-01T10:00:00Z', durationMinutes: 60,
  interviewType: 'Technical', interviewRound: 2, roundName: 'Tech Round 2',
  meetingLink: null, location: null, status: 'Scheduled',
  overallRating: null, recommendation: null, feedbackNotes: null,
  noShowReason: null, rescheduleCount: 0,
  createdAt: '', updatedAt: '',
  candidateName: 'Alice', candidateRole: 'Dev',
  candidateMatchScore: 88, candidateAvatarUrl: null, candidateSkills: ['ts'],
  jobTitle: 'Engineer',
}

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

describe('Interviewer CandidateDetailPage', () => {
  beforeEach(() => vi.mocked(getCandidateById).mockReset())

  it('renders back button + candidate name', async () => {
    vi.mocked(getCandidateById).mockResolvedValue(candidate)
    renderPage(<CandidateDetailPage interview={interview} onBack={vi.fn()} onFeedbackSuccess={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Back to Interviews/ })).toBeInTheDocument()
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
  })

  it('renders the interview details + AI analysis cards', async () => {
    vi.mocked(getCandidateById).mockResolvedValue(candidate)
    renderPage(<CandidateDetailPage interview={interview} onBack={vi.fn()} onFeedbackSuccess={vi.fn()} />)
    expect(screen.getByText('Interview Details')).toBeInTheDocument()
    expect(screen.getByText('AI Analysis Engine')).toBeInTheDocument()
  })

  it('renders the feedback section', async () => {
    vi.mocked(getCandidateById).mockResolvedValue(candidate)
    renderPage(<CandidateDetailPage interview={interview} onBack={vi.fn()} onFeedbackSuccess={vi.fn()} />)
    expect(screen.getByTestId('feedback-section')).toBeInTheDocument()
  })

  it('calls onBack when back pressed', async () => {
    vi.mocked(getCandidateById).mockResolvedValue(candidate)
    const onBack = vi.fn()
    renderPage(<CandidateDetailPage interview={interview} onBack={onBack} onFeedbackSuccess={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Back to Interviews/ }))
    expect(onBack).toHaveBeenCalled()
  })

  it('renders pipeline position from candidate status once loaded', async () => {
    vi.mocked(getCandidateById).mockResolvedValue(candidate)
    renderPage(<CandidateDetailPage interview={interview} onBack={vi.fn()} onFeedbackSuccess={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Pipeline Position')).toBeInTheDocument())
  })
})
