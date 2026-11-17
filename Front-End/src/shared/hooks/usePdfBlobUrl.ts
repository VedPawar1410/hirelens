import { useMemo, useEffect } from 'react'

type CachedPdf = {
  url: string
  refs: number
  revokeTimer: ReturnType<typeof setTimeout> | null
  createObjectURL: typeof URL.createObjectURL
}

const pdfUrlCache = new Map<string, CachedPdf>()
const REVOKE_DELAY_MS = 30_000

function createPdfUrl(base64: string): string {
  const blob = new Blob(
    [Uint8Array.from(atob(base64), (c) => c.codePointAt(0) ?? 0)],
    { type: 'application/pdf' },
  )
  return URL.createObjectURL(blob)
}

function acquirePdfUrl(base64: string): string {
  const cached = pdfUrlCache.get(base64)
  if (cached?.createObjectURL === URL.createObjectURL) {
    if (cached.revokeTimer) {
      clearTimeout(cached.revokeTimer)
      cached.revokeTimer = null
    }
    cached.refs += 1
    return cached.url
  }

  const url = createPdfUrl(base64)
  pdfUrlCache.set(base64, { url, refs: 1, revokeTimer: null, createObjectURL: URL.createObjectURL })
  return url
}

function releasePdfUrl(base64: string) {
  const cached = pdfUrlCache.get(base64)
  if (!cached) return

  cached.refs -= 1
  if (cached.refs > 0) return

  cached.revokeTimer = setTimeout(() => {
    const latest = pdfUrlCache.get(base64)
    if (!latest || latest.refs > 0) return
    URL.revokeObjectURL(latest.url)
    pdfUrlCache.delete(base64)
  }, REVOKE_DELAY_MS)
}

export function usePdfBlobUrl(base64: string | null): string | null {
  const blobUrl = useMemo(() => {
    if (!base64) return null
    try {
      return acquirePdfUrl(base64)
    } catch {
      return null
    }
  }, [base64])

  useEffect(() => {
    if (!base64) return
    return () => releasePdfUrl(base64)
  }, [base64])

  return blobUrl
}
