import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getResumes } from '../resumeApi'

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

describe('getResumes', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('GETs /resumes?jobId=', async () => {
    fetchSpy.mockResolvedValue(ok({ success: true, message: "ok", data: [] }))
    await getResumes('j1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/resumes?jobId=j1')
  })

  it('returns the mapped Resume[] array', async () => {
    fetchSpy.mockResolvedValue(ok({
      data: [
        {
          id: 'r1',
          filename: 'a.pdf',
          uploadedAt: '2026-01-01',
          status: 'processed',
          matchScore: 80,
          candidateId: 'c1',
          errorReason: null,
        },
      ],
    }))
    const result = await getResumes('j1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r1')
    expect(result[0].status).toBe('processed')
  })

  it('returns empty array when none', async () => {
    fetchSpy.mockResolvedValue(ok({ success: true, message: "ok", data: [] }))
    const result = await getResumes('j1')
    expect(result).toEqual([])
  })
})
