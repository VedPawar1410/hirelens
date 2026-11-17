import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecruitmentLayout from '../RecruitmentLayout'
import { AuthContext } from '../../../context/AuthContext'
import type { User } from '../../../types/index'

const navigateMock = vi.fn()
const logoutMock = vi.fn()
let mockIsMobile = false

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, onClick }: { to: string; children: ReactNode; onClick?: () => void }) => (
    <a href={to} onClick={onClick}>{children}</a>
  ),
  Outlet: () => <div data-testid="outlet">page</div>,
  useNavigate: () => navigateMock,
}))

vi.mock('../../../hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({
    isTiny: false, isMobile: mockIsMobile, isCompact: false,
    isTablet: false, isCompactTablet: false, isDesktop: true,
  }),
}))

const mockUser: User = { id: '1', username: 'rec1', role: 'recruitment', name: 'Rachel' }

function renderLayout() {
  return render(
    <AuthContext.Provider value={{ user: mockUser, isLoading: false, login: vi.fn(), logout: logoutMock }}>
      <RecruitmentLayout />
    </AuthContext.Provider>,
  )
}

describe('RecruitmentLayout', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    logoutMock.mockReset()
    mockIsMobile = false
  })

  it('renders all 4 nav items', () => {
    renderLayout()
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Job Folders').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Candidates').length).toBeGreaterThan(0)
    expect(screen.getAllByText('JD Creation').length).toBeGreaterThan(0)
  })

  it('renders the Outlet', () => {
    renderLayout()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('renders the user name in the sidebar', () => {
    renderLayout()
    expect(screen.getByText('Rachel')).toBeInTheDocument()
    expect(screen.getByText('Recruitment')).toBeInTheDocument()
  })

  it('Sign Out triggers logout + navigates to /login', async () => {
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: /Sign Out/ }))
    expect(logoutMock).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith({ to: '/login' })
  })

  it('shows the mobile toggle button when on mobile', () => {
    mockIsMobile = true
    renderLayout()
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument()
  })
})
