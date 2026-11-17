import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePdfBlobUrl } from '../usePdfBlobUrl'

const validBase64Pdf: string | null = btoa('%PDF-1.4 fake pdf content')

describe('usePdfBlobUrl', () => {
  let createSpy: ReturnType<typeof vi.spyOn>
  let revokeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    let counter = 0
    createSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:mock-${++counter}`)
    revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns null when base64 is null', () => {
    const { result } = renderHook(() => usePdfBlobUrl(null))
    expect(result.current).toBeNull()
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('returns a blob URL for a valid base64 string', () => {
    const { result } = renderHook(() => usePdfBlobUrl(validBase64Pdf))
    expect(result.current).toBe('blob:mock-1')
    expect(createSpy).toHaveBeenCalledTimes(1)
  })

  it('passes a PDF MIME type to the Blob', () => {
    const mockBlob = vi.fn((...args: ConstructorParameters<typeof Blob>) => new Blob(...args))
    vi.stubGlobal('Blob', mockBlob)
    renderHook(() => usePdfBlobUrl(validBase64Pdf))
    expect(mockBlob).toHaveBeenCalledWith(expect.any(Array), { type: 'application/pdf' })
  })

  it('returns null when base64 is invalid (atob throws)', () => {
    const { result } = renderHook(() => usePdfBlobUrl('not!!!valid==base64??'))
    expect(result.current).toBeNull()
  })

  it('revokes the blob URL on unmount', () => {
    vi.useFakeTimers()
    const { result, unmount } = renderHook(() => usePdfBlobUrl(validBase64Pdf))
    const url = result.current
    unmount()
    vi.advanceTimersByTime(30_000)
    expect(revokeSpy).toHaveBeenCalledWith(url)
    vi.useRealTimers()
  })

  it('creates a new blob URL when base64 changes', () => {
    const { result, rerender } = renderHook<string | null, { b64: string | null }>(
      ({ b64 }) => usePdfBlobUrl(b64),
      { initialProps: { b64: validBase64Pdf } },
    )
    const first = result.current
    rerender({ b64: btoa('different content') })
    expect(result.current).not.toBe(first)
    expect(createSpy).toHaveBeenCalledTimes(2)
  })

  it('revokes the previous blob URL when base64 changes', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook<string | null, { b64: string | null }>(
      ({ b64 }) => usePdfBlobUrl(b64),
      { initialProps: { b64: validBase64Pdf } },
    )
    const first = result.current
    rerender({ b64: btoa('different content') })
    vi.advanceTimersByTime(30_000)
    expect(revokeSpy).toHaveBeenCalledWith(first)
    vi.useRealTimers()
  })

  it('returns null when input flips from value to null', () => {
    const { result, rerender } = renderHook<string | null, { b64: string | null }>(
      ({ b64 }) => usePdfBlobUrl(b64),
      { initialProps: { b64: validBase64Pdf } },
    )
    rerender({ b64: null })
    expect(result.current).toBeNull()
  })
})
