import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import GlowOrb from '../GlowOrb'

function makeMockMedia(matches: boolean) {
  return vi.fn().mockImplementation(() => ({
    matches,
    media: '',
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('GlowOrb', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', makeMockMedia(false))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders an aria-hidden decorative div', () => {
    const { container } = render(<GlowOrb />)
    const div = container.firstChild as HTMLElement
    expect(div.getAttribute('aria-hidden')).toBe('true')
  })

  it('follows mouse position when motion is allowed', () => {
    const { container } = render(<GlowOrb />)
    const orb = container.firstChild as HTMLElement
    globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 500, clientY: 400 }))
    expect(orb.style.transform).toContain('translate')
  })

  it('does not register listener when prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', makeMockMedia(true))
    const addSpy = vi.spyOn(globalThis, 'addEventListener')
    render(<GlowOrb />)
    const moveCalls = addSpy.mock.calls.filter(c => c[0] === 'mousemove')
    expect(moveCalls).toHaveLength(0)
    addSpy.mockRestore()
  })

  it('removes the listener on unmount', () => {
    const removeSpy = vi.spyOn(globalThis, 'removeEventListener')
    const { unmount } = render(<GlowOrb />)
    unmount()
    const moveCalls = removeSpy.mock.calls.filter(c => c[0] === 'mousemove')
    expect(moveCalls.length).toBeGreaterThan(0)
    removeSpy.mockRestore()
  })
})
