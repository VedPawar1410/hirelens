import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../../../../shared/components/Toast/ToastProvider'
import CandidatesPage from '../CandidatesPage'

const navigateMock = vi.fn()
let mockSearch: Record<string, unknown> = {}

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
  useSearch: () => mockSearch,
}))
vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({ isTiny: false, isMobile: false, isCompact: false, isTablet: false, isCompactTablet: false, isDesktop: true }),
}))
vi.mock('../../api/candidatesApi', () => ({
  getCandidates: vi.fn(),
  getCandidateCounts: vi.fn(),
  moveToNextStage: vi.fn(),
  shortlistCandidate: vi.fn(),
  rejectCandidate: vi.fn(),
}))
vi.mock('../../api/interviewsApi', () => ({ getUpcomingInterviews: vi.fn() }))

import { getCandidates, getCandidateCounts } from '../../api/candidatesApi'
import { getUpcomingInterviews } from '../../api/interviewsApi'

function renderPage(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ToastProvider>{ui}</ToastProvider></QueryClientProvider>)
}

const emptyCounts = {
  underReview: 0, filtered: 0, shortlisted: 0, interviewing: 0,
  selected: 0, rejected: 0, topMatches: 0,
}

describe('CandidatesPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    mockSearch = {}
    vi.mocked(getCandidates).mockResolvedValue({ candidates: [], total: 0, page: 1, limit: 100 })
    vi.mocked(getCandidateCounts).mockResolvedValue(emptyCounts)
    vi.mocked(getUpcomingInterviews).mockResolvedValue({ count: 0, nextInterviewAt: null, nextCandidateName: null, nextCandidateId: null, nextJobId: null })
  })

  it('renders the page heading + subtitle', () => {
    renderPage(<CandidatesPage />)
    expect(screen.getByRole('heading', { name: 'Candidates Directory' })).toBeInTheDocument()
    expect(screen.getByText('Manage and search your entire talent pool.')).toBeInTheDocument()
  })

  it('renders the action signals + filter bar', async () => {
    renderPage(<CandidatesPage />)
    await waitFor(() => expect(screen.getByPlaceholderText(/Search by name/)).toBeInTheDocument())
  })

  it('renders empty list state once query resolves', async () => {
    renderPage(<CandidatesPage />)
    await waitFor(() => expect(screen.getByText('No candidates yet.')).toBeInTheDocument())
  })

  it('renders the result count once candidates load', async () => {
    // NOTE: TanStack Virtualizer renders 0 rows in jsdom (container has 0 height),
    // so assert the data-driven count footer rather than virtualized row content.
    vi.mocked(getCandidates).mockResolvedValue({
      candidates: [{
        id: 'c1', name: 'Alice', currentRole: 'Dev', avatarUrl: null,
        matchScore: 88, isDuplicate: false, appliedJob: { id: 'j1', title: 'Eng' },
        applicationSource: 'Direct Upload', status: 'shortlisted', appliedDate: '2026-01-01',
        email: null, phone: null, linkedIn: null, gitHub: null, skills: null, experience: null, education: null,
      }],
      total: 1, page: 1, limit: 100,
    })
    renderPage(<CandidatesPage />)
    await waitFor(() => expect(screen.getByText(/Showing/)).toBeInTheDocument())
  })

  it('respects initial topAts filter from search params (minScore=80)', async () => {
    mockSearch = { filter: 'topAts' }
    vi.mocked(getCandidates).mockResolvedValue({ candidates: [], total: 0, page: 1, limit: 100 })
    renderPage(<CandidatesPage />)
    await waitFor(() => expect(vi.mocked(getCandidates)).toHaveBeenCalled())
    expect(vi.mocked(getCandidates).mock.calls.some(c => c[0]?.minScore === 80)).toBe(true)
  })
})
