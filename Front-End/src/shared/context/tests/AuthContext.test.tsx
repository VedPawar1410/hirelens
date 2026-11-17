import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import { AuthContext, AuthProvider } from '../AuthContext'
import { queryClient } from '../../lib/queryClient'
import type { User } from '../../types/index'

vi.mock('../../api/authApi', () => ({
  login: vi.fn(),
  logout: vi.fn(),
}))
vi.mock('../../lib/session', () => ({
  ensureSession: vi.fn(),
  getSessionUser: vi.fn(),
  setSessionUser: vi.fn(),
}))

import { login as apiLogin, logout as apiLogout } from '../../api/authApi'
import { ensureSession, getSessionUser, setSessionUser } from '../../lib/session'

const mockUser: User = { id: '1', username: 'alice', role: 'recruitment', name: 'Alice' }

function useConsumer() {
  return useContext(AuthContext)
}

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(apiLogin).mockReset()
    vi.mocked(apiLogout).mockReset().mockResolvedValue(undefined)
    vi.mocked(ensureSession).mockReset().mockResolvedValue(null)
    vi.mocked(getSessionUser).mockReset().mockReturnValue(null)
    vi.mocked(setSessionUser).mockReset()
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('renders children', () => {
    render(<AuthProvider><div>child content</div></AuthProvider>)
    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('restores the user from the cookie session on mount', async () => {
    vi.mocked(ensureSession).mockResolvedValue(mockUser)
    const { result } = renderHook(() => useConsumer(), { wrapper })
    await waitFor(() => expect(result.current?.user).toEqual(mockUser))
  })

  it('starts with null user when there is no session', async () => {
    const { result } = renderHook(() => useConsumer(), { wrapper })
    expect(result.current?.user).toBeNull()
    expect(result.current?.isLoading).toBe(false)
    await waitFor(() => expect(ensureSession).toHaveBeenCalled())
  })

  it('removes the legacy localStorage auth payload on mount', async () => {
    localStorage.setItem('ats_user', JSON.stringify({ token: 'tok', user: mockUser }))
    renderHook(() => useConsumer(), { wrapper })
    await waitFor(() => expect(localStorage.getItem('ats_user')).toBeNull())
  })

  it('login() stores the session user and exposes the user', async () => {
    vi.mocked(apiLogin).mockResolvedValue({ user: mockUser })
    const { result } = renderHook(() => useConsumer(), { wrapper })

    await act(async () => {
      await result.current!.login('alice', 'pw', 'recruitment')
    })

    expect(apiLogin).toHaveBeenCalledWith('alice', 'pw', 'recruitment')
    expect(setSessionUser).toHaveBeenCalledWith(mockUser)
    expect(result.current?.user).toEqual(mockUser)
  })

  it('login() clears isLoading even when the api throws', async () => {
    vi.mocked(apiLogin).mockRejectedValue(new Error('bad creds'))
    const { result } = renderHook(() => useConsumer(), { wrapper })

    await act(async () => {
      await result.current!.login('x', 'y', 'recruitment').catch(() => undefined)
    })

    expect(result.current?.isLoading).toBe(false)
    expect(result.current?.user).toBeNull()
  })

  it('logout() calls the server, clears query cache, session, and user', async () => {
    vi.mocked(ensureSession).mockResolvedValue(mockUser)
    const clearSpy = vi.spyOn(queryClient, 'clear')
    const { result } = renderHook(() => useConsumer(), { wrapper })
    await waitFor(() => expect(result.current?.user).toEqual(mockUser))

    act(() => result.current!.logout())

    expect(apiLogout).toHaveBeenCalled()
    expect(setSessionUser).toHaveBeenCalledWith(null)
    expect(result.current?.user).toBeNull()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  it('ats:session-expired event logs the user out', async () => {
    vi.mocked(ensureSession).mockResolvedValue(mockUser)
    const { result } = renderHook(() => useConsumer(), { wrapper })
    await waitFor(() => expect(result.current?.user).toEqual(mockUser))

    act(() => {
      globalThis.dispatchEvent(new Event('ats:session-expired'))
    })

    await waitFor(() => expect(result.current?.user).toBeNull())
    expect(setSessionUser).toHaveBeenCalledWith(null)
  })
})
