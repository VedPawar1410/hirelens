import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getGreeting } from '../dateUtils'

const GOOD_MORNING = 'Good morning'

describe('getGreeting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Good morning" before noon', () => {
    vi.setSystemTime(new Date('2026-05-25T08:00:00'))
    expect(getGreeting()).toBe(GOOD_MORNING)
  })

  it('returns "Good morning" at 11:59am (boundary)', () => {
    vi.setSystemTime(new Date('2026-05-25T11:59:00'))
    expect(getGreeting()).toBe(GOOD_MORNING)
  })

  it('returns "Good afternoon" at noon', () => {
    vi.setSystemTime(new Date('2026-05-25T12:00:00'))
    expect(getGreeting()).toBe('Good afternoon')
  })

  it('returns "Good afternoon" at 4:59pm (boundary)', () => {
    vi.setSystemTime(new Date('2026-05-25T16:59:00'))
    expect(getGreeting()).toBe('Good afternoon')
  })

  it('returns "Good evening" at 5pm', () => {
    vi.setSystemTime(new Date('2026-05-25T17:00:00'))
    expect(getGreeting()).toBe('Good evening')
  })

  it('returns "Good evening" near midnight', () => {
    vi.setSystemTime(new Date('2026-05-25T23:30:00'))
    expect(getGreeting()).toBe('Good evening')
  })

  it('returns "Good morning" at midnight', () => {
    vi.setSystemTime(new Date('2026-05-25T00:00:00'))
    expect(getGreeting()).toBe(GOOD_MORNING)
  })
})
