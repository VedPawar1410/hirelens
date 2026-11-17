import { describe, it, expect, vi } from 'vitest'
import type { User } from '../../types'

vi.mock('../../api/authApi', () => ({ getMe: vi.fn() }))

const mockUser: User = { id: '1', username: 'alice', role: 'recruitment', name: 'Alice' }

// The session cache is module-level state, so each test imports a fresh copy.
// resetModules does NOT recreate the mock fn, so its call history is cleared here.
async function freshModules() {
  vi.resetModules()
  const authApi = await import('../../api/authApi')
  const session = await import('../session')
  const getMe = vi.mocked(authApi.getMe)
  getMe.mockReset()
  return { getMe, ...session }
}

describe('ensureSession', () => {
  it('resolves the user from /auth/me and caches the result', async () => {
    const { getMe, ensureSession, getSessionUser } = await freshModules()
    getMe.mockResolvedValue(mockUser)

    await expect(ensureSession()).resolves.toEqual(mockUser)
    await expect(ensureSession()).resolves.toEqual(mockUser)

    expect(getMe).toHaveBeenCalledTimes(1)
    expect(getSessionUser()).toEqual(mockUser)
  })

  it('maps a failed restore to a logged-out session', async () => {
    const { getMe, ensureSession, getSessionUser } = await freshModules()
    getMe.mockRejectedValue(new Error('offline'))

    await expect(ensureSession()).resolves.toBeNull()
    expect(getSessionUser()).toBeNull()
  })
})

describe('setSessionUser', () => {
  it('seeds the cache so router guards see the login result without refetching', async () => {
    const { getMe, ensureSession, setSessionUser, getSessionUser } = await freshModules()

    setSessionUser(mockUser)

    await expect(ensureSession()).resolves.toEqual(mockUser)
    expect(getMe).not.toHaveBeenCalled()
    expect(getSessionUser()).toEqual(mockUser)
  })

  it('clears the cached session on logout', async () => {
    const { getMe, ensureSession, setSessionUser, getSessionUser } = await freshModules()
    getMe.mockResolvedValue(mockUser)
    await ensureSession()

    setSessionUser(null)

    expect(getSessionUser()).toBeNull()
    await expect(ensureSession()).resolves.toBeNull()
  })
})
