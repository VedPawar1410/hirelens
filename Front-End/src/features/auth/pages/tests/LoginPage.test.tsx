import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../LoginPage'
import { ApiError } from '../../../../shared/types/api'

const loginMock = vi.fn()
const showToastMock = vi.fn()
const navigateMock = vi.fn()
const startAnimationMock = vi.fn()

vi.mock('../../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ login: loginMock }),
}))
vi.mock('../../../../shared/hooks/useToast', () => ({
  useToast: () => ({ showToast: showToastMock }),
}))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))
vi.mock('../../../../shared/hooks/useLoginAnimation', () => ({
  useLoginAnimation: () => ({
    animPhase: 'idle', flyStyle: {}, capturedUser: '', isAnimating: false,
    startAnimation: startAnimationMock,
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset()
    showToastMock.mockReset()
    navigateMock.mockReset()
    startAnimationMock.mockReset()
  })

  it('renders panel selection initially', () => {
    render(<LoginPage />)
    expect(screen.getByText('Choose your panel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Recruitment Panel/ })).toBeInTheDocument()
  })

  it('shows the login form after selecting a panel', async () => {
    render(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /Recruitment Panel/ }))
    expect(screen.getByText('Sign in to your panel')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
  })

  it('calls login with credentials + role on submit', async () => {
    loginMock.mockResolvedValue(undefined)
    render(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /Recruitment Panel/ }))
    await userEvent.type(screen.getByLabelText('Username'), 'alice')
    await userEvent.type(screen.getByLabelText('Password'), 'pw')
    await userEvent.click(screen.getByRole('button', { name: /Sign In/ }))
    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('alice', 'pw', 'recruitment'))
  })

  it('shows inline error on 401', async () => {
    loginMock.mockRejectedValue(new ApiError('Invalid credentials', 401))
    render(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /Recruitment Panel/ }))
    await userEvent.type(screen.getByLabelText('Username'), 'a')
    await userEvent.type(screen.getByLabelText('Password'), 'b')
    await userEvent.click(screen.getByRole('button', { name: /Sign In/ }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Invalid credentials/))
  })

  it('shows toast on non-401 errors', async () => {
    loginMock.mockRejectedValue(new ApiError('Server error', 500))
    render(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /Interviewer Panel/ }))
    await userEvent.type(screen.getByLabelText('Username'), 'a')
    await userEvent.type(screen.getByLabelText('Password'), 'b')
    await userEvent.click(screen.getByRole('button', { name: /Sign In/ }))
    await waitFor(() => expect(showToastMock).toHaveBeenCalledWith('Something went wrong, please try again.', 'error'))
  })

  it('triggers the post-login animation on success', async () => {
    loginMock.mockResolvedValue(undefined)
    render(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /Recruitment Panel/ }))
    await userEvent.type(screen.getByLabelText('Username'), 'alice')
    await userEvent.type(screen.getByLabelText('Password'), 'pw')
    await userEvent.click(screen.getByRole('button', { name: /Sign In/ }))
    await waitFor(() => expect(startAnimationMock).toHaveBeenCalled())
  })
})
