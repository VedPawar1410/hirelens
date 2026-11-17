import { ApiError } from '../types/api'
import { queryClient } from '../lib/queryClient'

// Strip trailing slash so callers can write `/drafts` without worrying about double-slashes
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

// Auth travels in the ATSAuth HttpOnly cookie (credentials: 'include' on every
// fetch). On these endpoints a 401 is a normal answer ("bad credentials" / "no
// session yet"), not an expired session, so they bypass handleExpired.
const SESSION_BOOTSTRAP_PATHS = new Set(['/auth/login', '/auth/me', '/auth/logout'])

// Called on any 401 response. We clear cache first so a future login doesn't
// inherit stale data from the expired session. The CustomEvent lets ToastProvider
// show a "session expired" message without this file importing React.
function handleExpired(): never {
  queryClient.clear()
  globalThis.dispatchEvent(new CustomEvent('ats:session-expired'))
  throw new ApiError('Session expired', 401)
}

async function readErrorBody(res: Response): Promise<{ message?: string; fields?: Record<string, string> }> {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // .catch() converts network failures (offline, DNS failure) into a typed ApiError
  // instead of an untyped TypeError, so callers get consistent error handling
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  }).catch(() => {
    throw new ApiError('No connection, check your network', 0)
  })

  if (res.status === 401) {
    if (SESSION_BOOTSTRAP_PATHS.has(path)) {
      const body = await readErrorBody(res)
      throw new ApiError(body.message ?? 'Invalid credentials', 401, body.fields)
    }

    return handleExpired()
  }

  if (!res.ok) {
    // Server may send a JSON body with a human-readable message and field-level errors.
    // If the body isn't JSON (e.g. 502 from a proxy), we fall back to a generic message.
    const body = await readErrorBody(res)
    throw new ApiError(body.message ?? 'Server error', res.status, body.fields)
  }

  // 204 No Content — calling res.json() on an empty body throws, so return undefined
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// Multipart upload — omits Content-Type so the browser sets multipart boundary automatically
export async function apiFetchFormData<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body,
  }).catch(() => {
    throw new ApiError('No connection, check your network', 0)
  })

  if (res.status === 401) return handleExpired()
  if (!res.ok) {
    const errorBody = await readErrorBody(res)
    throw new ApiError(errorBody.message ?? 'Upload failed', res.status, errorBody.fields)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// SSE fetch — opens a streaming response and calls onMessage for each parsed event.
// The server sends `data: <json>\n\n` lines; this reader handles partial chunks and buffers
// across reads so no event is lost on a TCP boundary.
export async function apiFetchEventStream<T>(
  path: string,
  onMessage: (event: T) => void,
  options: RequestInit = {}
): Promise<void> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  }).catch(() => {
    throw new ApiError('No connection, check your network', 0)
  })

  if (res.status === 401) return handleExpired()
  if (!res.ok) {
    const body = await readErrorBody(res)
    throw new ApiError(body.message ?? 'Server error', res.status, body.fields)
  }

  if (!res.body) return

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  function processRawEvent(rawEvent: string) {
    const dataLines = rawEvent
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('data:'))
      .map(l => l.slice(5).trim())
      .filter(Boolean)

    for (const data of dataLines) {
      try {
        onMessage(JSON.parse(data) as T)
      } catch {
        // ignore malformed frames
      }
    }
  }

  function flushBuffer(final = false) {
    buffer = buffer.replaceAll('\r\n', '\n')
    let boundaryIndex
    while ((boundaryIndex = buffer.indexOf('\n\n')) !== -1) {
      processRawEvent(buffer.slice(0, boundaryIndex))
      buffer = buffer.slice(boundaryIndex + 2)
    }
    if (final && buffer.trim()) {
      processRawEvent(buffer)
      buffer = ''
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    flushBuffer()
  }
  flushBuffer(true)
}

// Abort-able wrapper around apiFetchEventStream — returns an unsubscribe function.
// Use this for long-lived SSE subscriptions tied to component lifecycle.
export function subscribeEventStream<T>(
  path: string,
  onMessage: (event: T) => void,
  onError?: (error: unknown) => void
): () => void {
  const controller = new AbortController()
  apiFetchEventStream<T>(path, onMessage, { signal: controller.signal })
    .catch(error => {
      if ((error as DOMException)?.name !== 'AbortError') onError?.(error)
    })
  return () => controller.abort()
}

// Separate fetch for binary responses — no Content-Type header so the browser
// handles the response as raw bytes rather than trying to parse it as JSON
export async function apiFetchBlob(path: string): Promise<Blob> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
  }).catch(() => {
    throw new ApiError('No connection, check your network', 0)
  })

  if (res.status === 401) return handleExpired()
  if (!res.ok) throw new ApiError('Download failed', res.status)
  return res.blob()
}
