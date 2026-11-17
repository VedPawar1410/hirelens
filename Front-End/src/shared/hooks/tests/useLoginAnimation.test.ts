import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useLoginAnimation } from '../useLoginAnimation'

function makeLogo(): HTMLImageElement {
  const img = document.createElement('img')
  img.getBoundingClientRect = () => ({
    left: 100,
    top: 50,
    width: 40,
    height: 40,
    right: 140,
    bottom: 90,
    x: 100,
    y: 50,
    toJSON: () => ({}),
  })
  return img
}

describe('useLoginAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in idle phase with empty captured user', () => {
    const { result } = renderHook(() => useLoginAnimation())
    expect(result.current.animPhase).toBe('idle')
    expect(result.current.capturedUser).toBe('')
    expect(result.current.isAnimating).toBe(false)
    expect(result.current.flyStyle).toEqual({})
  })

  it('transitions through all phases on startAnimation', () => {
    const { result } = renderHook(() => useLoginAnimation())
    const onDone = vi.fn()
    const logo = makeLogo()

    act(() => {
      result.current.startAnimation(logo, 'alice', onDone)
    })

    expect(result.current.animPhase).toBe('collapse')
    expect(result.current.capturedUser).toBe('ALICE')
    expect(result.current.isAnimating).toBe(true)
    expect(result.current.flyStyle.left).toBe('100px')
    expect(result.current.flyStyle.top).toBe('50px')

    act(() => { vi.advanceTimersByTime(60) })
    expect(result.current.animPhase).toBe('fly-center')

    act(() => { vi.advanceTimersByTime(620) })
    expect(result.current.animPhase).toBe('greet')

    act(() => { vi.advanceTimersByTime(1040) })
    expect(result.current.animPhase).toBe('fly-corner')

    expect(onDone).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(520) })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('uppercases the captured username', () => {
    const { result } = renderHook(() => useLoginAnimation())
    act(() => {
      result.current.startAnimation(makeLogo(), 'lowercaseUser', vi.fn())
    })
    expect(result.current.capturedUser).toBe('LOWERCASEUSER')
  })

  it('cancels prior timers when restarted mid-animation', () => {
    const { result } = renderHook(() => useLoginAnimation())
    const firstDone = vi.fn()
    const secondDone = vi.fn()

    act(() => { result.current.startAnimation(makeLogo(), 'one', firstDone) })
    act(() => { vi.advanceTimersByTime(100) })
    act(() => { result.current.startAnimation(makeLogo(), 'two', secondDone) })
    act(() => { vi.advanceTimersByTime(3000) })

    expect(firstDone).not.toHaveBeenCalled()
    expect(secondDone).toHaveBeenCalledTimes(1)
  })

  it('clears pending timers on unmount', () => {
    const { result, unmount } = renderHook(() => useLoginAnimation())
    const onDone = vi.fn()
    act(() => { result.current.startAnimation(makeLogo(), 'user', onDone) })
    unmount()
    act(() => { vi.advanceTimersByTime(5000) })
    expect(onDone).not.toHaveBeenCalled()
  })
})
