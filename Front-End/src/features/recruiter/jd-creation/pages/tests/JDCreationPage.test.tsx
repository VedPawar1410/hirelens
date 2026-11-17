import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import JDCreationPage from '../JDCreationPage'

vi.mock('../../../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1', username: 'rec1', role: 'recruitment', name: 'Rachel' } }),
}))
vi.mock('../../../../../shared/hooks/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }))
vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({ isTiny: false, isMobile: false, isCompact: false, isTablet: false, isCompactTablet: false, isDesktop: true }),
}))
vi.mock('../../api/jdApi', () => ({ getDrafts: vi.fn().mockResolvedValue([]) }))
// AssignInterviewerPanel (inside FormActionsPanel) queries interviewers
vi.mock('../../../../../shared/api/authApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../shared/api/authApi')>()
  return { ...actual, getInterviewers: vi.fn().mockResolvedValue([]) }
})

function renderPage(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('Recruiter JDCreationPage', () => {
  it('renders heading + AI-powered pill', () => {
    renderPage(<JDCreationPage />)
    expect(screen.getByRole('heading', { name: 'JD Creation' })).toBeInTheDocument()
    expect(screen.getByText(/AI-Powered/)).toBeInTheDocument()
  })

  it('renders the experience level selector', () => {
    renderPage(<JDCreationPage />)
    expect(screen.getByRole('button', { name: 'Intern' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fresher' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Experienced' })).toBeInTheDocument()
  })

  it('does not show the form until a level is selected', () => {
    renderPage(<JDCreationPage />)
    expect(screen.queryByPlaceholderText(/Frontend Developer/)).toBeNull()
  })

  it('reveals the JD form after picking an experience level', async () => {
    renderPage(<JDCreationPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Experienced' }))
    await waitFor(() => expect(screen.getByPlaceholderText(/Frontend Developer/)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Create JD/ })).toBeInTheDocument()
  })
})
