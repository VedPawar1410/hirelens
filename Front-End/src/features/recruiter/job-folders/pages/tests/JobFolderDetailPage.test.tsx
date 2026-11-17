import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import JobFolderDetailPage from '../JobFolderDetailPage'
import type { JobFolder } from '../../../../../shared/types/index'

const navigateMock = vi.fn()
const mockUseColumnCandidates = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ jobId: 'j1' }),
  useSearch: () => ({ stage: undefined }),
}))
vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({ isTiny: false, isMobile: false, isCompact: false, isTablet: false, isCompactTablet: false, isDesktop: true }),
}))
vi.mock('../../../candidates/api/candidatesApi', () => ({
  getCandidateById: vi.fn(),
  moveToNextStage: vi.fn(), moveToPreviousStage: vi.fn(), rejectCandidate: vi.fn(),
  getCandidateStageCountsByJob: vi.fn(),
}))
vi.mock('../../api/jobsApi', () => ({ getJobFolder: vi.fn() }))
vi.mock('../../../jd-creation/api/resumeApi', () => ({ getResumes: vi.fn() }))
vi.mock('../../hooks/useAtsScoreStream', () => ({ useAtsScoreStream: vi.fn() }))
vi.mock('../../components/UploadResumeModal', () => ({
  // `open` is required — a closed <dialog> is removed from the a11y tree, so getByRole('dialog') can't find it
  UploadResumeModal: () => <dialog open aria-label="Upload Resumes" />,
}))
vi.mock('../../../candidates/hooks/useColumnCandidates', () => ({
  useColumnCandidates: (...args: unknown[]) => mockUseColumnCandidates(...args),
}))

import { getJobFolder, } from '../../api/jobsApi'
import { getCandidateStageCountsByJob } from '../../../candidates/api/candidatesApi'
import { getResumes } from '../../../jd-creation/api/resumeApi'

const folder: JobFolder = {
  id: 'j1', jobTitle: 'Senior Engineer', department: 'R&D', location: 'Remote',
  candidatesCount: 10, filteredCount: 2, status: 'active', createdAt: '',
  topCandidates: [], applicationHistory: [],
}

function renderPage(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('JobFolderDetailPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    vi.mocked(getJobFolder).mockResolvedValue(folder)
    vi.mocked(getCandidateStageCountsByJob).mockResolvedValue({ under_review: 4, shortlisted: 3 })
    vi.mocked(getResumes).mockResolvedValue([])
    mockUseColumnCandidates.mockReturnValue({
      data: { pages: [{ candidates: [], total: 0 }] },
      fetchNextPage: vi.fn(), hasNextPage: false, isFetchingNextPage: false, isLoading: false,
    })
  })

  it('renders the folder title once loaded', async () => {
    renderPage(<JobFolderDetailPage />)
    await waitFor(() => expect(screen.getByText('Senior Engineer')).toBeInTheDocument())
  })

  it('renders the stage rail with stage names', async () => {
    renderPage(<JobFolderDetailPage />)
    // "Under Review" appears in both the rail and the list-pane header, so use getAllByText
    await waitFor(() => expect(screen.getAllByText('Under Review').length).toBeGreaterThan(0))
    expect(screen.getByText('Shortlisted')).toBeInTheDocument()
  })

  it('renders the "select a candidate" placeholder when none selected', async () => {
    renderPage(<JobFolderDetailPage />)
    await waitFor(() => expect(screen.getByText('Select a candidate to view details')).toBeInTheDocument())
  })

  it('navigates back to jobs list on back button', async () => {
    renderPage(<JobFolderDetailPage />)
    await waitFor(() => screen.getByText('Senior Engineer'))
    await userEvent.click(screen.getByRole('button', { name: /Job Folders/ }))
    expect(navigateMock).toHaveBeenCalledWith({ to: '/recruitment/jobs' })
  })

  it('opens the upload modal from the header', async () => {
    renderPage(<JobFolderDetailPage />)
    await waitFor(() => screen.getByText('Senior Engineer'))
    await userEvent.click(screen.getByRole('button', { name: /Upload Resumes/ }))
    expect(screen.getByRole('dialog', { name: 'Upload Resumes' })).toBeInTheDocument()
  })
})
