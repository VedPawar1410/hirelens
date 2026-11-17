import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  mapJobFolder,
  getJobFolders,
  getJobFolder,
  updateJobFolderStatus,
  uploadResumes,
} from '../jobsApi'

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function rawFolder(overrides = {}) {
  return {
    id: 'j1',
    jobTitle: 'Eng',
    department: 'R&D',
    location: 'Remote',
    candidatesCount: 5,
    status: 'active' as const,
    createdAt: '2026-01-01',
    ...overrides,
  }
}

describe('mapJobFolder', () => {
  it('passes through populated fields', () => {
    const raw = rawFolder({
      filteredCount: 2,
      topCandidates: [{ name: 'Alice', avatarUrl: 'a.png' }],
      applicationHistory: [1, 2, 3],
    })
    const folder = mapJobFolder(raw)
    expect(folder.id).toBe('j1')
    expect(folder.filteredCount).toBe(2)
    expect(folder.topCandidates).toEqual([{ name: 'Alice', avatarUrl: 'a.png' }])
    expect(folder.applicationHistory).toEqual([1, 2, 3])
  })

  it('defaults filteredCount to 0 when missing', () => {
    expect(mapJobFolder(rawFolder()).filteredCount).toBe(0)
  })

  it('defaults topCandidates to []', () => {
    expect(mapJobFolder(rawFolder()).topCandidates).toEqual([])
  })

  it('defaults applicationHistory to []', () => {
    expect(mapJobFolder(rawFolder()).applicationHistory).toEqual([])
  })
})

describe('getJobFolders', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('GETs /jobs?page=1&limit=20 by default', async () => {
    fetchSpy.mockResolvedValue(ok({ jobs: [], total: 0, page: 1, limit: 20 }))
    await getJobFolders()
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/jobs?page=1&limit=20')
  })

  it('GETs /jobs with custom page+limit', async () => {
    fetchSpy.mockResolvedValue(ok({ jobs: [], total: 0, page: 3, limit: 50 }))
    await getJobFolders(3, 50)
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/jobs?page=3&limit=50')
  })

  it('maps every job folder', async () => {
    fetchSpy.mockResolvedValue(ok({
      jobs: [rawFolder(), rawFolder({ id: 'j2' })],
      total: 2, page: 1, limit: 20,
    }))
    const result = await getJobFolders()
    expect(result.jobs).toHaveLength(2)
    expect(result.jobs[0].topCandidates).toEqual([])
  })
})

describe('getJobFolder', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('GETs /jobs/:id and maps the folder', async () => {
    fetchSpy.mockResolvedValue(ok(rawFolder({ jobTitle: 'Senior Eng' })))
    const result = await getJobFolder('j1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/jobs/j1')
    expect(result.jobTitle).toBe('Senior Eng')
  })
})

describe('updateJobFolderStatus', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('PATCHes /jobs/:id/status with folderStatus body', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 204 }))
    await updateJobFolderStatus('j1', 'closed')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/jobs/j1/status')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ folderStatus: 'closed' })
  })
})

function uploadResp(filenames: string[]) {
  return {
    processed: filenames.length,
    categorized: filenames.map(name => ({
      fileName: name,
      status: 'created' as const,
      matchedJob: null,
      candidateId: 'c-' + name,
      error: null,
      atsScore: 80,
    })),
  }
}

describe('uploadResumes', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('uploads a single batch when files.length=1', async () => {
    fetchSpy.mockResolvedValue(ok(uploadResp(['a.pdf'])))
    const result = await uploadResumes([new File([''], 'a.pdf')])
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result.processed).toBe(1)
    expect(result.results).toHaveLength(1)
  })

  it('splits 20 files into 10 batches and calls progress for each', async () => {
    fetchSpy.mockImplementation(() => Promise.resolve(ok(uploadResp(['x.pdf', 'y.pdf']))))
    const files = Array.from({ length: 20 }, (_, i) => new File([''], `f${i}.pdf`))
    const onBatchComplete = vi.fn()
    const onBatchResult = vi.fn()

    await uploadResumes(files, undefined, onBatchComplete, onBatchResult)

    expect(fetchSpy).toHaveBeenCalledTimes(10)
    expect(onBatchComplete).toHaveBeenCalledTimes(10)
    expect(onBatchComplete).toHaveBeenLastCalledWith(10, 10)
    expect(onBatchResult).toHaveBeenCalledTimes(10)
  })

  it('appends jobId field to FormData when provided', async () => {
    fetchSpy.mockResolvedValue(ok(uploadResp(['a.pdf'])))
    await uploadResumes([new File([''], 'a.pdf')], 'job-1')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const fd = init.body as FormData
    expect(fd.get('jobId')).toBe('job-1')
  })

  it('marks failed batch files with status="failed" and continues', async () => {
    fetchSpy
      .mockResolvedValueOnce(ok(uploadResp(['a.pdf'])))
      .mockResolvedValueOnce(new Response('boom', { status: 500 }))
    const files = [new File([''], 'a.pdf'), new File([''], 'b.pdf')]
    const onBatchResult = vi.fn()

    const result = await uploadResumes(files, undefined, undefined, onBatchResult)

    expect(result.results.some(r => r.status === 'failed' && r.fileName === 'b.pdf')).toBe(true)
    expect(onBatchResult).toHaveBeenCalledTimes(2)
  })

  it('aggregates processed counts across all batches', async () => {
    fetchSpy.mockResolvedValue(ok(uploadResp(['x.pdf'])))
    const files = [new File([''], 'a.pdf'), new File([''], 'b.pdf')]
    const result = await uploadResumes(files)
    expect(result.processed).toBe(2)
  })
})
