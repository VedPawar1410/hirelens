import { getMe } from '../api/authApi'
import type { User } from '../types'

// The session lives in the ATSAuth HttpOnly cookie, which JS cannot read.
// This module-level cache lets the router guards and AuthProvider share a
// single /auth/me round-trip per page load instead of each firing their own.
let currentUser: User | null = null
let restore: Promise<User | null> | null = null

export function ensureSession(): Promise<User | null> {
  restore ??= getMe()
    .then(user => {
      currentUser = user
      return user
    })
    .catch(() => {
      currentUser = null
      return null
    })
  return restore
}

export function getSessionUser(): User | null {
  return currentUser
}

export function setSessionUser(user: User | null): void {
  currentUser = user
  restore = Promise.resolve(user)
}
