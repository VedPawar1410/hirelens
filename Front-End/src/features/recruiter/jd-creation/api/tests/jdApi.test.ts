import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDraftById,
  getDrafts,
  createDraft,
  updateDraft,
  assignDraft,
  submitRoleDescription,
  submitDraft,
  generatePreview,
  finalizeDraft,
  dismissDraft,
  deleteDraft,
  getPublishedJDs,
  getPdf,
} from '../jdApi'

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function envelope<T>(data: T) {
  return { success: true, message: 'ok', data, errors: null }
}

function rawDraft(overrides = {}) {
  return {
    id: 'd1',
    experienceLevel: 'experienced' as const,
    jobTitle: 'Eng',
    location: 'Remote',
    workMode: 'Hybrid',
    workHours: '40',
    duration: 'Full-time',
    stipendSalary: '',
    fulltimeOfferSalary: '120k',
    yearsOfExperience: '3-5',
    noticePeriod: null,
    relevantExperience: null,
    roleDescription: null,
    generatedJd: null,
    assignedTo: null,
    interviewRounds: null,
    status: 'draft' as const,
    createdBy: 'alice',
    createdAt: '2026-01-01',
    ...overrides,
  }
}

const fullPayload = {
  experienceLevel: 'experienced' as const,
  jobTitle: 'Eng',
  location: 'Remote',
  workMode: 'Hybrid',
  workHours: '40',
  duration: 'Full-time',
  stipendSalary: '',
  fulltimeOfferSalary: '120k',
  yearsOfExperience: '3-5',
  noticePeriod: '30 days',
  relevantExperience: '4',
  roleDescription: 'desc',
  assignedTo: ['iv1'],
  interviewRounds: [],
}

describe('mapDraft (via getDraftById)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('normalizes null noticePeriod/relevantExperience/roleDescription/generatedJd to empty strings', async () => {
    fetchSpy.mockResolvedValue(ok(envelope(rawDraft())))
    const result = await getDraftById('d1')
    expect(result.noticePeriod).toBe('')
    expect(result.relevantExperience).toBe('')
    expect(result.roleDescription).toBe('')
    expect(result.generatedJd).toBe('')
  })

  it('normalizes null assignedTo to []', async () => {
    fetchSpy.mockResolvedValue(ok(envelope(rawDraft())))
    const result = await getDraftById('d1')
    expect(result.assignedTo).toEqual([])
  })

  it('preserves non-null values', async () => {
    fetchSpy.mockResolvedValue(ok(envelope(rawDraft({
      noticePeriod: '30 days',
      assignedTo: ['iv1', 'iv2'],
      generatedJd: 'JD body here',
    }))))
    const result = await getDraftById('d1')
    expect(result.noticePeriod).toBe('30 days')
    expect(result.assignedTo).toEqual(['iv1', 'iv2'])
    expect(result.generatedJd).toBe('JD body here')
  })
})

describe('getDraftById', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('GETs /drafts/:id', async () => {
    fetchSpy.mockResolvedValue(ok(envelope(rawDraft())))
    await getDraftById('d1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/drafts/d1')
  })
})

describe('getDrafts', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('builds query string from filters', async () => {
    fetchSpy.mockResolvedValue(ok(envelope([])))
    await getDrafts({ createdBy: 'alice', assignedTo: 'iv1', status: 'assigned' })
    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain('createdBy=alice')
    expect(url).toContain('assignedTo=iv1')
    expect(url).toContain('status=assigned')
  })

  it('hits /drafts? with empty query when no filters', async () => {
    fetchSpy.mockResolvedValue(ok(envelope([])))
    await getDrafts({})
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/drafts?')
  })

  it('maps every returned draft via mapDraft', async () => {
    fetchSpy.mockResolvedValue(ok(envelope([rawDraft(), rawDraft({ id: 'd2' })])))
    const result = await getDrafts({})
    expect(result).toHaveLength(2)
    expect(result[0].assignedTo).toEqual([])
  })
})

describe('createDraft', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('POSTs the payload to /drafts and returns mapped draft', async () => {
    fetchSpy.mockResolvedValue(ok(envelope(rawDraft())))
    await createDraft(fullPayload)
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/drafts')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body as string)
    expect(body.jobTitle).toBe('Eng')
    expect(body.assignedTo).toEqual(['iv1'])
  })
})

describe('updateDraft', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('PATCHes /drafts/:id without assignedTo when assign=false', async () => {
    fetchSpy.mockResolvedValue(ok(envelope(rawDraft())))
    await updateDraft('d1', fullPayload, false)
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const body = JSON.parse(init.body as string)
    expect(body.assignedTo).toBeUndefined()
    expect(body.status).toBeUndefined()
  })

  it('PATCHes /drafts/:id with assignedTo + status="assigned" when assign=true', async () => {
    fetchSpy.mockResolvedValue(ok(envelope(rawDraft())))
    await updateDraft('d1', fullPayload, true)
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const body = JSON.parse(init.body as string)
    expect(body.assignedTo).toEqual(['iv1'])
    expect(body.status).toBe('assigned')
  })
})

describe('other write endpoints', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('assignDraft PATCHes /drafts/:id/assign with assignedTo', async () => {
    fetchSpy.mockResolvedValue(ok(envelope(rawDraft())))
    await assignDraft('d1', ['iv1', 'iv2'])
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/drafts/d1/assign')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ assignedTo: ['iv1', 'iv2'] })
  })

  it('submitRoleDescription PATCHes /drafts/:id/role-description', async () => {
    fetchSpy.mockResolvedValue(ok(envelope(rawDraft())))
    await submitRoleDescription('d1', 'role desc here')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/drafts/d1/role-description')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual({ roleDescription: 'role desc here' })
  })

  it('submitDraft PATCHes /drafts/:id/submit with empty JSON body', async () => {
    fetchSpy.mockResolvedValue(ok(envelope(rawDraft())))
    await submitDraft('d1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/drafts/d1/submit')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('PATCH')
    expect(init.body).toBe('{}')
  })

  it('generatePreview POSTs /drafts/:id/generate and returns data', async () => {
    fetchSpy.mockResolvedValue(ok(envelope({ previewJD: 'generated text' })))
    const result = await generatePreview('d1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/drafts/d1/generate')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('POST')
    expect(result.previewJD).toBe('generated text')
  })

  it('finalizeDraft POSTs the finalize payload to /drafts/:id/finalize', async () => {
    fetchSpy.mockResolvedValue(ok(envelope(rawDraft())))
    await finalizeDraft('d1', { ...fullPayload, finalJD: 'final text' })
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/drafts/d1/finalize')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const body = JSON.parse(init.body as string)
    expect(body.finalJD).toBe('final text')
  })

  it('dismissDraft PATCHes /drafts/:id/dismiss with username', async () => {
    fetchSpy.mockResolvedValue(ok(envelope(rawDraft())))
    await dismissDraft('d1', 'iv1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/drafts/d1/dismiss')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual({ username: 'iv1' })
  })

  it('deleteDraft DELETEs /drafts/:id', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 204 }))
    await deleteDraft('d1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/drafts/d1')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('DELETE')
  })
})

describe('getPublishedJDs', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('delegates to getDrafts with status="finalized"', async () => {
    fetchSpy.mockResolvedValue(ok(envelope([])))
    await getPublishedJDs('alice')
    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain('createdBy=alice')
    expect(url).toContain('status=finalized')
  })
})

describe('getPdf', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('fetches /drafts/:id/pdf and returns a Blob', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    fetchSpy.mockResolvedValue(new Response(blob, { status: 200 }))
    const result = await getPdf('d1')
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/drafts/d1/pdf')
    expect(result).toBeInstanceOf(Blob)
  })
})
