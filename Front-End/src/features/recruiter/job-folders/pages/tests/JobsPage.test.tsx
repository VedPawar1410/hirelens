import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import JobsPage from '../JobsPage'
import type { JobFolder } from '../../../../../shared/types/index'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigateMock }))
vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({ isTiny: false, isMobile: false, isCompact: false, isTablet: false, isCompactTablet: false, isDesktop: true }),
}))
vi.mock('../../api/jobsApi', () => ({
  getJobFolders: vi.fn(),
  updateJobFolderStatus: vi.fn(),
}))

import { getJobFolders } from '../../api/jobsApi'

const DEFAULT_JOB_TITLE = 'Engineer'

function folder(overrides: Partial<JobFolder> = {}): JobFolder {
  return {
    id: 'j1', jobTitle: DEFAULT_JOB_TITLE, department: 'R&D', location: 'Remote',
    candidatesCount: 10, filteredCount: 3, status: 'active', createdAt: new Date().toISOString(),
    topCandidates: [], applicationHistory: [1, 2, 3],
    ...overrides,
  }
}

function renderPage(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('JobsPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    vi.mocked(getJobFolders).mockReset()
  })

  it('renders heading + New folder button', async () => {
    vi.mocked(getJobFolders).mockResolvedValue({ jobs: [], total: 0, page: 1, limit: 200 })
    renderPage(<JobsPage />)
    expect(screen.getByRole('heading', { name: 'Job Folders' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /New folder/ })).toBeInTheDocument()
  })

  it('renders folders once query resolves', async () => {
    vi.mocked(getJobFolders).mockResolvedValue({ jobs: [folder()], total: 1, page: 1, limit: 200 })
    renderPage(<JobsPage />)
    await waitFor(() => expect(screen.getByText(DEFAULT_JOB_TITLE)).toBeInTheDocument())
  })

  it('shows empty state when no folders', async () => {
    vi.mocked(getJobFolders).mockResolvedValue({ jobs: [], total: 0, page: 1, limit: 200 })
    renderPage(<JobsPage />)
    await waitFor(() => expect(screen.getByText(/No job folders yet/)).toBeInTheDocument())
  })

  it('filters folders by search', async () => {
    vi.mocked(getJobFolders).mockResolvedValue({
      jobs: [folder({ id: 'j1', jobTitle: DEFAULT_JOB_TITLE }), folder({ id: 'j2', jobTitle: 'Designer' })],
      total: 2, page: 1, limit: 200,
    })
    renderPage(<JobsPage />)
    await waitFor(() => expect(screen.getByText(DEFAULT_JOB_TITLE)).toBeInTheDocument())
    await userEvent.type(screen.getByPlaceholderText('Search jobs…'), 'desi')
    expect(screen.getByText('Designer')).toBeInTheDocument()
    expect(screen.queryByText(DEFAULT_JOB_TITLE)).toBeNull()
  })

  it('navigates to JD creation on New folder click', async () => {
    vi.mocked(getJobFolders).mockResolvedValue({ jobs: [], total: 0, page: 1, limit: 200 })
    renderPage(<JobsPage />)
    await userEvent.click(screen.getByRole('button', { name: /New folder/ }))
    expect(navigateMock).toHaveBeenCalledWith({ to: '/recruitment/jd-creation' })
  })

  it('navigates to detail when a row is clicked', async () => {
    vi.mocked(getJobFolders).mockResolvedValue({ jobs: [folder()], total: 1, page: 1, limit: 200 })
    renderPage(<JobsPage />)
    await waitFor(() => screen.getByRole('button', { name: `Open ${DEFAULT_JOB_TITLE}` }))
    await userEvent.click(screen.getByRole('button', { name: `Open ${DEFAULT_JOB_TITLE}` }))
    expect(navigateMock).toHaveBeenCalledWith({ to: '/recruitment/jobs/$jobId', params: { jobId: 'j1' }, search: { stage: undefined } })
  })
})
