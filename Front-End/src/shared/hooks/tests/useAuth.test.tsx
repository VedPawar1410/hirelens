import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { AuthContext } from '../../context/AuthContext'
import type { User } from '../../types/index'

const mockUser: User = { id: '1', username: 'jane', role: 'recruitment', name: 'Jane' }

describe('useAuth', () => {
  it('throws when used outside an AuthProvider', () => {
    const renderUnwrapped = () => renderHook(() => useAuth())
    expect(renderUnwrapped).toThrow(/useAuth must be used inside AuthProvider/)
  })

  it('returns the provided context value', () => {
    const value = { user: mockUser, isLoading: false, login: vi.fn(), logout: vi.fn() }
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current).toBe(value)
    expect(result.current.user).toEqual(mockUser)
  })

  it('returns null user when not logged in', () => {
    const value = { user: null, isLoading: false, login: vi.fn(), logout: vi.fn() }
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
  })

  it('reflects isLoading=true during auth flow', () => {
    const value = { user: null, isLoading: true, login: vi.fn(), logout: vi.fn() }
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isLoading).toBe(true)
  })
})
