import { apiFetch } from './apiClient'
import { ApiError, type LoginResponse } from '../types/api'
import type { User, UserRole } from '../types'

interface BackendUser {
  id: string
  username: string
  name: string
  role: string
}

interface BackendLoginResponse {
  success: boolean
  message: string
  data: {
    user: BackendUser
  }
}

function mapUserRole(role: string, fallback: UserRole): UserRole {
  const normalized = role.toLowerCase()
  if (normalized === 'recruiter' || normalized === 'recruitment') return 'recruitment'
  if (normalized === 'interviewer') return 'interviewer'
  return fallback
}

function mapUser(user: BackendUser, fallbackRole: UserRole): User {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: mapUserRole(user.role, fallbackRole),
  }
}

export interface Interviewer {
  id: string
  username: string
  fullName: string
  email: string
}

export const INTERVIEWERS_QUERY_KEY = ['interviewers'] as const

export async function getInterviewers(): Promise<Interviewer[]> {
  const res = await apiFetch<{ success: boolean; data: Interviewer[] }>('/auth/interviewers')
  return res.data
}

export async function login(
  username: string,
  password: string,
  role: UserRole
): Promise<LoginResponse> {
  const res = await apiFetch<BackendLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ userName: username, password, role }),
  })

  return { user: mapUser(res.data.user, role) }
}

// Restores identity from the ATSAuth HttpOnly cookie. 401 means "no session" —
// a normal state, not an error — so it maps to null instead of throwing.
export async function getMe(): Promise<User | null> {
  try {
    const res = await apiFetch<{ success: boolean; data: BackendUser }>('/auth/me')
    return mapUser(res.data, 'interviewer')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

// The cookie is HttpOnly, so only the server can clear it
export async function logout(): Promise<void> {
  await apiFetch<unknown>('/auth/logout', { method: 'POST' })
}
