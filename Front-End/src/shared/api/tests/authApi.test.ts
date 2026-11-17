import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { login, logout, getMe, getInterviewers, INTERVIEWERS_QUERY_KEY } from '../authApi'

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function backendResp(role: string) {
  return {
    success: true,
    message: 'ok',
    data: {
      user: { id: 'u1', username: 'alice', name: 'Alice', role },
    },
  }
}

describe('login', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('POSTs userName/password/role to /auth/login', async () => {
    fetchSpy.mockResolvedValue(ok(backendResp('recruitment')))
    await login('alice', 'pw', 'recruitment')

    expect(fetchSpy.mock.calls[0][0]).toBe('/api/auth/login')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      userName: 'alice',
      password: 'pw',
      role: 'recruitment',
    })
  })

  it('returns mapped LoginResponse without any token — the JWT stays in the cookie', async () => {
    fetchSpy.mockResolvedValue(ok(backendResp('Recruitment')))
    const result = await login('alice', 'pw', 'recruitment')
    expect(result).toEqual({
      user: { id: 'u1', username: 'alice', name: 'Alice', role: 'recruitment' },
    })
  })

  it('normalizes role string "Recruiter" to "recruitment"', async () => {
    fetchSpy.mockResolvedValue(ok(backendResp('Recruiter')))
    const result = await login('a', 'b', 'recruitment')
    expect(result.user.role).toBe('recruitment')
  })

  it('normalizes role string "INTERVIEWER" to "interviewer"', async () => {
    fetchSpy.mockResolvedValue(ok(backendResp('INTERVIEWER')))
    const result = await login('a', 'b', 'interviewer')
    expect(result.user.role).toBe('interviewer')
  })

  it('falls back to the requested role when server returns unknown role', async () => {
    fetchSpy.mockResolvedValue(ok(backendResp('admin')))
    const result = await login('a', 'b', 'interviewer')
    expect(result.user.role).toBe('interviewer')
  })
})

describe('getMe', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('GETs /auth/me and maps the user', async () => {
    fetchSpy.mockResolvedValue(ok({
      success: true,
      data: { id: 'u1', username: 'alice', name: 'Alice', role: 'Recruitment' },
    }))

    const user = await getMe()

    expect(fetchSpy.mock.calls[0][0]).toBe('/api/auth/me')
    expect(user).toEqual({ id: 'u1', username: 'alice', name: 'Alice', role: 'recruitment' })
  })

  it('returns null on 401 — no session is a normal state, not an error', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    }))
    await expect(getMe()).resolves.toBeNull()
  })

  it('rethrows non-401 failures', async () => {
    fetchSpy.mockResolvedValue(new Response('oops', { status: 500 }))
    await expect(getMe()).rejects.toMatchObject({ status: 500 })
  })
})

describe('logout', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('POSTs /auth/logout so the server clears the HttpOnly cookie', async () => {
    fetchSpy.mockResolvedValue(ok({ success: true, data: null }))
    await logout()
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/auth/logout')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('POST')
  })
})

describe('getInterviewers', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('GETs /auth/interviewers and unwraps the envelope', async () => {
    const interviewers = [
      { id: '1', username: 'iv1', fullName: 'Eve One', email: 'eve@example.com' },
      { id: '2', username: 'iv2', fullName: 'Bob Two', email: 'bob@example.com' },
    ]
    fetchSpy.mockResolvedValue(ok({ success: true, data: interviewers }))

    const result = await getInterviewers()

    expect(fetchSpy.mock.calls[0][0]).toBe('/api/auth/interviewers')
    expect(result).toEqual(interviewers)
  })
})

describe('INTERVIEWERS_QUERY_KEY', () => {
  it('is the stable key ["interviewers"]', () => {
    expect(INTERVIEWERS_QUERY_KEY).toEqual(['interviewers'])
  })
})
