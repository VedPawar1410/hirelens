import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useWindowSize } from '../useWindowSize'

describe('useWindowSize', () => {
  const originalWidth = globalThis.innerWidth
  const originalHeight = globalThis.innerHeight

  beforeEach(() => {
    Object.defineProperty(globalThis, 'innerWidth', { value: 1024, configurable: true, writable: true })
    Object.defineProperty(globalThis, 'innerHeight', { value: 768, configurable: true, writable: true })
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'innerWidth', { value: originalWidth, configurable: true, writable: true })
    Object.defineProperty(globalThis, 'innerHeight', { value: originalHeight, configurable: true, writable: true })
  })

  it('returns the initial window dimensions', () => {
    const { result } = renderHook(() => useWindowSize())
    expect(result.current).toEqual({ width: 1024, height: 768 })
  })

  it('updates when window resizes', () => {
    const { result } = renderHook(() => useWindowSize())
    act(() => {
      Object.defineProperty(globalThis, 'innerWidth', { value: 500, configurable: true, writable: true })
      Object.defineProperty(globalThis, 'innerHeight', { value: 800, configurable: true, writable: true })
      globalThis.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toEqual({ width: 500, height: 800 })
  })

  it('removes the resize listener on unmount', () => {
    const removeSpy = vi.spyOn(globalThis, 'removeEventListener')
    const { unmount } = renderHook(() => useWindowSize())
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    removeSpy.mockRestore()
  })
})
