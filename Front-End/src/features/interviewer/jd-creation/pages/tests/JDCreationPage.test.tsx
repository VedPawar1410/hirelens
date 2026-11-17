import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import JDCreationPage from '../JDCreationPage'
import type { JDDraft } from '../../../../../shared/types'

const showToastMock = vi.fn()

vi.mock('../../../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1', username: 'iv1', role: 'interviewer', name: 'Ivy' } }),
}))
vi.mock('../../../../../shared/hooks/useToast', () => ({ useToast: () => ({ showToast: showToastMock }) }))
vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({ isTiny: false, isMobile: false, isCompact: false, isTablet: false, isCompactTablet: false, isDesktop: true }),
}))
vi.mock('../../../../recruiter/jd-creation/api/jdApi', () => ({
  getDrafts: vi.fn(),
  submitRoleDescription: vi.fn(),
  submitDraft: vi.fn(),
}))

import { getDrafts } from '../../../../recruiter/jd-creation/api/jdApi'

function draft(overrides: Partial<JDDraft> = {}): JDDraft {
  return {
    id: 'd1', experienceLevel: 'experienced', jobTitle: 'Engineer',
    location: 'Remote', workMode: 'Hybrid', workHours: '40',
    duration: '', stipendSalary: '', fulltimeOfferSalary: '100k',
    yearsOfExperience: '3-5', noticePeriod: '', relevantExperience: '',
    roleDescription: '', generatedJd: '', assignedTo: ['iv1'], interviewRounds: [],
    status: 'assigned', createdBy: 'rec1', createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function renderPage(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('Interviewer JDCreationPage', () => {
  beforeEach(() => {
    showToastMock.mockReset()
    vi.mocked(getDrafts).mockReset()
  })

  it('renders heading and panel pill', async () => {
    vi.mocked(getDrafts).mockResolvedValue([])
    renderPage(<JDCreationPage />)
    expect(screen.getByRole('heading', { name: 'JD Creation' })).toBeInTheDocument()
    expect(screen.getByText('Interview Panel')).toBeInTheDocument()
  })

  it('shows the "Select a JD to begin" placeholder when none selected', async () => {
    vi.mocked(getDrafts).mockResolvedValue([])
    renderPage(<JDCreationPage />)
    expect(screen.getByText('Select a JD to begin')).toBeInTheDocument()
  })

  it('renders pending count badge when there are assigned drafts', async () => {
    vi.mocked(getDrafts).mockResolvedValue([draft()])
    renderPage(<JDCreationPage />)
    await waitFor(() => expect(screen.getByText('1 pending')).toBeInTheDocument())
  })

  it('opens detail editor when a draft is selected', async () => {
    vi.mocked(getDrafts).mockResolvedValue([draft({ jobTitle: 'Engineer' })])
    renderPage(<JDCreationPage />)
    await waitFor(() => screen.getAllByText('Engineer'))
    await userEvent.click(screen.getAllByText('Engineer')[0])
    expect(screen.getByRole('button', { name: 'Submit Back to Recruitment' })).toBeInTheDocument()
  })
})
