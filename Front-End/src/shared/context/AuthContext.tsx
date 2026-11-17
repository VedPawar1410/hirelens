import { createContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/authApi'
import { queryClient } from '../lib/queryClient'
import { ensureSession, getSessionUser, setSessionUser } from '../lib/session'
import type { User, UserRole } from '../types/index'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(getSessionUser)
  const [isLoading, setIsLoading] = useState(false)

  // The session lives in the ATSAuth HttpOnly cookie — identity is restored
  // via /auth/me (shared with the router guards through ensureSession)
  useEffect(() => {
    // One-time cleanup: pre-cookie versions stored the token in localStorage
    localStorage.removeItem('ats_user')
    let cancelled = false
    void ensureSession().then(restored => {
      if (!cancelled) setUser(restored)
    })
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (username: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true)
    try {
      const res = await apiLogin(username, password, role)
      setSessionUser(res.user)
      setUser(res.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback((): void => {
    // Best-effort server call — the HttpOnly cookie can only be cleared server-side.
    // Local state is cleared regardless so the UI logs out even if the call fails.
    void apiLogout().catch(() => {})
    setSessionUser(null)
    // Clear cached query data so the next user who logs in on the same browser
    // doesn't briefly see the previous user's drafts
    queryClient.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    const handler = () => {
      setSessionUser(null)
      queryClient.clear()
      setUser(null)
    }
    globalThis.addEventListener('ats:session-expired', handler)
    return () => globalThis.removeEventListener('ats:session-expired', handler)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
