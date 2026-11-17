import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDashboardStats,
  getApplicationVolume,
  getRecentJobFolders,
  getPipelineFunnel,
  getAttentionItems,
} from '../dashboardApi'

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

describe('dashboardApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('getDashboardStats GETs /dashboard/stats and maps the fields', async () => {
    fetchSpy.mockResolvedValue(ok({
      activeJobs: 5,
      totalApplications: 100,
      aiMatches: 20,
      interviewsPending: 3,
    }))
    const result = await getDashboardStats()
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/dashboard/stats')
    expect(result).toEqual({
      activeJobs: 5,
      totalApplications: 100,
      aiMatches: 20,
      interviewsPending: 3,
    })
  })

  it('getApplicationVolume defaults to period=7d and unwraps data', async () => {
    fetchSpy.mockResolvedValue(ok({ data: [{ day: 'Mon', apps: 4 }] }))
    const result = await getApplicationVolume()
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/dashboard/application-volume?period=7d')
    expect(result).toEqual([{ day: 'Mon', apps: 4 }])
  })

  it('getApplicationVolume respects period override', async () => {
    fetchSpy.mockResolvedValue(ok({ data: [] }))
    await getApplicationVolume('30d')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/dashboard/application-volume?period=30d')
  })

  it('getRecentJobFolders maps folder objects via mapJobFolder', async () => {
    fetchSpy.mockResolvedValue(ok({
      folders: [{
        id: 'j1',
        jobTitle: 'Eng',
        department: 'R&D',
        location: 'Remote',
        candidatesCount: 5,
        status: 'active',
        createdAt: '2026-01-01',
      }],
    }))
    const result = await getRecentJobFolders()
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/dashboard/recent-job-folders?limit=3')
    expect(result[0].jobTitle).toBe('Eng')
    expect(result[0].filteredCount).toBe(0)
    expect(result[0].topCandidates).toEqual([])
    expect(result[0].applicationHistory).toEqual([])
  })

  it('getPipelineFunnel GETs /dashboard/pipeline-funnel and passes through', async () => {
    const funnel = { stages: [], selectedRate: 0.1, avgCycleDays: 12 }
    fetchSpy.mockResolvedValue(ok(funnel))
    const result = await getPipelineFunnel()
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/dashboard/pipeline-funnel')
    expect(result).toEqual(funnel)
  })

  it('getAttentionItems GETs /dashboard/attention-items', async () => {
    fetchSpy.mockResolvedValue(ok([{ type: 'stale', count: 3, title: 'x', actionPath: '/' }]))
    const result = await getAttentionItems()
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/dashboard/attention-items')
    expect(result).toHaveLength(1)
  })
})
