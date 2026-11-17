import { describe, it, expect, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBreakpoints } from '../useBreakpoints'

function setWidth(w: number) {
  Object.defineProperty(globalThis, 'innerWidth', { value: w, configurable: true, writable: true })
  Object.defineProperty(globalThis, 'innerHeight', { value: 800, configurable: true, writable: true })
}

describe('useBreakpoints', () => {
  const original = globalThis.innerWidth

  afterEach(() => {
    setWidth(original)
  })

  it('flags tiny + mobile + compact at 400px', () => {
    setWidth(400)
    const { result } = renderHook(() => useBreakpoints())
    expect(result.current).toEqual({
      isTiny: true,
      isMobile: true,
      isCompact: true,
      isTablet: false,
      isCompactTablet: false,
      isDesktop: false,
    })
  })

  it('flags mobile + compact (not tiny) at 480px', () => {
    setWidth(480)
    const { result } = renderHook(() => useBreakpoints())
    expect(result.current.isTiny).toBe(false)
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isCompact).toBe(true)
  })

  it('flags compact-tablet at 700px (between 640 and 1024)', () => {
    setWidth(700)
    const { result } = renderHook(() => useBreakpoints())
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isCompact).toBe(false)
    expect(result.current.isCompactTablet).toBe(true)
    expect(result.current.isTablet).toBe(false)
  })

  it('flags tablet at 768px', () => {
    setWidth(768)
    const { result } = renderHook(() => useBreakpoints())
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isCompactTablet).toBe(true)
    expect(result.current.isDesktop).toBe(false)
  })

  it('flags desktop at 1024px and above', () => {
    setWidth(1024)
    const { result } = renderHook(() => useBreakpoints())
    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isMobile).toBe(false)
  })

  it('flags desktop at very wide viewport', () => {
    setWidth(1920)
    const { result } = renderHook(() => useBreakpoints())
    expect(result.current.isDesktop).toBe(true)
  })
})
