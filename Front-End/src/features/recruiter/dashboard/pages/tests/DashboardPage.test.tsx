import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardPage from '../DashboardPage'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigateMock }))
vi.mock('../../../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1', username: 'rec1', role: 'recruitment', name: 'Rachel' } }),
}))
vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({ isTiny: false, isMobile: false, isCompact: false, isTablet: false, isCompactTablet: false, isDesktop: true }),
}))
vi.mock('../../api/dashboardApi', () => ({
  getDashboardStats: vi.fn().mockResolvedValue({ activeJobs: 5, totalApplications: 120, aiMatches: 18, interviewsPending: 4 }),
  getApplicationVolume: vi.fn().mockResolvedValue([{ day: 'Mon', apps: 4 }]),
  getRecentJobFolders: vi.fn().mockResolvedValue([]),
  getPipelineFunnel: vi.fn().mockResolvedValue({ stages: [], selectedRate: 0, avgCycleDays: 0 }),
  getAttentionItems: vi.fn().mockResolvedValue([]),
}))

function renderPage(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('Recruiter DashboardPage', () => {
  beforeEach(() => navigateMock.mockReset())

  it('renders the dashboard heading + greeting', () => {
    renderPage(<DashboardPage />)
    expect(screen.getByRole('heading', { name: 'Recruiter Dashboard' })).toBeInTheDocument()
    expect(screen.getByText(/Rachel/)).toBeInTheDocument()
  })

  it('renders the four stat card labels', () => {
    renderPage(<DashboardPage />)
    expect(screen.getByText('Active Jobs')).toBeInTheDocument()
    expect(screen.getByText('Total Applications')).toBeInTheDocument()
    expect(screen.getByText('AI Matches (>80%)')).toBeInTheDocument()
    expect(screen.getByText('Interviews pending')).toBeInTheDocument()
  })

  it('renders stat values once queries resolve', async () => {
    renderPage(<DashboardPage />)
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument())
    expect(screen.getByText('120')).toBeInTheDocument()
  })

  it('navigates to jobs when New JD pressed', async () => {
    renderPage(<DashboardPage />)
    await userEvent.click(screen.getByRole('button', { name: /New JD/ }))
    expect(navigateMock).toHaveBeenCalledWith({ to: '/recruitment/jd-creation' })
  })

  it('navigates to candidates when Import resumes pressed', async () => {
    renderPage(<DashboardPage />)
    await userEvent.click(screen.getByRole('button', { name: /Import resumes/ }))
    expect(navigateMock).toHaveBeenCalledWith({ to: '/recruitment/candidates', search: { status: undefined, filter: undefined } })
  })
})
