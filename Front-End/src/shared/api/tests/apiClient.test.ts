import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiError } from '../../types/api'
import {
  apiFetch,
  apiFetchFormData,
  apiFetchBlob,
  apiFetchEventStream,
  subscribeEventStream,
} from '../apiClient'
import { queryClient } from '../../lib/queryClient'

const BASE = '/api'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function emptyResponse(status: number): Response {
  return new Response(null, { status })
}

function streamOf(chunks: string[]): Response {
  const encoder = new TextEncoder()
  let i = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]))
      } else {
        controller.close()
      }
    },
  })
  return new Response(stream, { status: 200 })
}

describe('apiFetch', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed JSON on 200', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ id: '1' }))
    const result = await apiFetch<{ id: string }>('/drafts')
    expect(result).toEqual({ id: '1' })
  })

  it('prefixes BASE_URL to the path', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({}))
    await apiFetch('/x')
    expect(fetchSpy.mock.calls[0][0]).toBe(`${BASE}/x`)
  })

  it('sets Content-Type: application/json by default', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({}))
    await apiFetch('/x')
    const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('never attaches an Authorization header — auth travels in the HttpOnly cookie', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({}))
    await apiFetch('/x')
    const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('returns undefined on 204 No Content', async () => {
    fetchSpy.mockResolvedValue(emptyResponse(204))
    const result = await apiFetch('/x')
    expect(result).toBeUndefined()
  })

  it('throws ApiError with body message on 4xx', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ message: 'Bad request', fields: { name: 'required' } }, 400))
    await expect(apiFetch('/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Bad request',
      fields: { name: 'required' },
    })
  })

  it('throws ApiError with fallback message when error body is not JSON', async () => {
    fetchSpy.mockResolvedValue(new Response('<html>502</html>', { status: 502 }))
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 502, message: 'Server error' })
  })

  it('throws ApiError(0) on network failure', async () => {
    fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(apiFetch('/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: 'No connection, check your network',
    })
  })

  it('401 on /auth/login surfaces credentials error without dispatching session-expired', async () => {
    const expiredSpy = vi.fn()
    globalThis.addEventListener('ats:session-expired', expiredSpy)
    fetchSpy.mockResolvedValue(jsonResponse({ message: 'Invalid credentials' }, 401))

    await expect(apiFetch('/auth/login', { method: 'POST' })).rejects.toMatchObject({
      status: 401,
      message: 'Invalid credentials',
    })
    expect(expiredSpy).not.toHaveBeenCalled()
    globalThis.removeEventListener('ats:session-expired', expiredSpy)
  })

  it('401 on /auth/me surfaces the error without dispatching session-expired', async () => {
    const expiredSpy = vi.fn()
    globalThis.addEventListener('ats:session-expired', expiredSpy)
    fetchSpy.mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, 401))

    await expect(apiFetch('/auth/me')).rejects.toMatchObject({ status: 401 })
    expect(expiredSpy).not.toHaveBeenCalled()
    globalThis.removeEventListener('ats:session-expired', expiredSpy)
  })

  it('401 on other paths clears the query cache and dispatches session-expired', async () => {
    const clearSpy = vi.spyOn(queryClient, 'clear')
    const expiredSpy = vi.fn()
    globalThis.addEventListener('ats:session-expired', expiredSpy)
    fetchSpy.mockResolvedValue(jsonResponse({ message: 'Expired' }, 401))

    await expect(apiFetch('/drafts')).rejects.toMatchObject({ status: 401 })
    expect(clearSpy).toHaveBeenCalled()
    expect(expiredSpy).toHaveBeenCalled()
    globalThis.removeEventListener('ats:session-expired', expiredSpy)
    clearSpy.mockRestore()
  })

  it('sends credentials: include on every call', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({}))
    await apiFetch('/x')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).credentials).toBe('include')
  })

  it('forwards method, body, and custom headers from options', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({}))
    await apiFetch('/x', { method: 'POST', body: '{"a":1}', headers: { 'X-Trace': 't' } })
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"a":1}')
    expect((init.headers as Record<string, string>)['X-Trace']).toBe('t')
  })
})

describe('apiFetchFormData', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('POSTs FormData without Content-Type so the browser sets the boundary', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ ok: true }))
    const fd = new FormData()
    fd.append('files', new File(['a'], 'a.pdf'))
    await apiFetchFormData('/resumes/upload', fd)
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe(fd)
    expect((init.headers as Record<string, string> | undefined)?.['Content-Type']).toBeUndefined()
  })

  it('returns parsed JSON on 200', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ processed: 3 }))
    const result = await apiFetchFormData<{ processed: number }>('/resumes/upload', new FormData())
    expect(result.processed).toBe(3)
  })

  it('returns undefined on 204', async () => {
    fetchSpy.mockResolvedValue(emptyResponse(204))
    const result = await apiFetchFormData('/x', new FormData())
    expect(result).toBeUndefined()
  })

  it('throws ApiError("Upload failed", status) on non-OK', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({}, 500))
    await expect(apiFetchFormData('/x', new FormData())).rejects.toMatchObject({
      message: 'Upload failed',
      status: 500,
    })
  })

  it('throws ApiError(0) on network failure', async () => {
    fetchSpy.mockRejectedValue(new TypeError('boom'))
    await expect(apiFetchFormData('/x', new FormData())).rejects.toMatchObject({ status: 0 })
  })
})

describe('apiFetchBlob', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('returns the response Blob on success', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    fetchSpy.mockResolvedValue(new Response(blob, { status: 200 }))
    const result = await apiFetchBlob('/drafts/1/pdf')
    expect(result).toBeInstanceOf(Blob)
  })

  it('sends credentials: include so the auth cookie flows', async () => {
    fetchSpy.mockResolvedValue(new Response(new Blob(), { status: 200 }))
    await apiFetchBlob('/x')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).credentials).toBe('include')
  })

  it('throws ApiError("Download failed") on non-OK', async () => {
    fetchSpy.mockResolvedValue(new Response('', { status: 404 }))
    await expect(apiFetchBlob('/x')).rejects.toMatchObject({ message: 'Download failed', status: 404 })
  })

  it('throws ApiError(0) on network failure', async () => {
    fetchSpy.mockRejectedValue(new TypeError('boom'))
    await expect(apiFetchBlob('/x')).rejects.toMatchObject({ status: 0 })
  })
})

describe('apiFetchEventStream', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('parses SSE data: frames and calls onMessage for each', async () => {
    fetchSpy.mockResolvedValue(streamOf([
      'data: {"v":1}\n\n',
      'data: {"v":2}\n\n',
    ]))
    const messages: unknown[] = []
    await apiFetchEventStream('/stream', (m) => messages.push(m))
    expect(messages).toEqual([{ v: 1 }, { v: 2 }])
  })

  it('handles events split across chunks', async () => {
    fetchSpy.mockResolvedValue(streamOf([
      'data: {"a":',
      '1}\n\ndata: {"b":2}\n\n',
    ]))
    const messages: unknown[] = []
    await apiFetchEventStream('/stream', (m) => messages.push(m))
    expect(messages).toEqual([{ a: 1 }, { b: 2 }])
  })

  it('ignores malformed JSON frames', async () => {
    fetchSpy.mockResolvedValue(streamOf([
      'data: not json\n\ndata: {"ok":true}\n\n',
    ]))
    const messages: unknown[] = []
    await apiFetchEventStream('/stream', (m) => messages.push(m))
    expect(messages).toEqual([{ ok: true }])
  })

  it('throws on non-OK response', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ message: 'Forbidden' }, 403))
    await expect(apiFetchEventStream('/stream', () => undefined)).rejects.toMatchObject({ status: 403 })
  })

  it('throws ApiError(0) on network failure', async () => {
    fetchSpy.mockRejectedValue(new TypeError('boom'))
    await expect(apiFetchEventStream('/stream', () => undefined)).rejects.toBeInstanceOf(ApiError)
  })
})

describe('subscribeEventStream', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    localStorage.clear()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })
  afterEach(() => vi.restoreAllMocks())

  it('returns an unsubscribe fn that aborts the request', () => {
    fetchSpy.mockImplementation((_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      }),
    )
    const onError = vi.fn()
    const unsubscribe = subscribeEventStream('/stream', () => undefined, onError)
    expect(typeof unsubscribe).toBe('function')
    unsubscribe()
  })

  it('does not call onError when the stream is intentionally aborted (unsubscribe)', async () => {
    fetchSpy.mockImplementation(
      (_url: RequestInfo | URL, init?: RequestInit) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      }),
    )
    const onError = vi.fn()
    const unsubscribe = subscribeEventStream('/stream', () => undefined, onError)
    unsubscribe()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(onError).not.toHaveBeenCalled()
  })

  it('invokes onError for non-abort errors', async () => {
    fetchSpy.mockRejectedValue(new TypeError('network down'))
    const onError = vi.fn()
    subscribeEventStream('/stream', () => undefined, onError)
    await new Promise(r => setTimeout(r, 10))
    expect(onError).toHaveBeenCalled()
  })
})
