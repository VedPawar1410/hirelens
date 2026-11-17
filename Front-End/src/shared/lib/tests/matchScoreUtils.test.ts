import { describe, it, expect } from 'vitest'
import { getMatchScoreStyle } from '../matchScoreUtils'

const GREY_COLOR = '#9ca3af'

describe('getMatchScoreStyle', () => {
  it('returns neutral grey for null (unscored)', () => {
    expect(getMatchScoreStyle(null)).toEqual({
      color: '#6b7280',
      bg: 'rgba(156,163,175,0.08)',
    })
  })

  it('returns green for 80 and above', () => {
    const style = getMatchScoreStyle(80)
    expect(style.color).toBe('#22c55e')
    expect(style.bg).toBe('rgba(20,83,45,0.2)')
  })

  it('returns green for 100', () => {
    expect(getMatchScoreStyle(100).color).toBe('#22c55e')
  })

  it('returns blue for 60 (lower boundary)', () => {
    const style = getMatchScoreStyle(60)
    expect(style.color).toBe('#6ea8fe')
    expect(style.bg).toBe('rgba(29,43,164,0.18)')
  })

  it('returns blue for 79 (upper boundary)', () => {
    expect(getMatchScoreStyle(79).color).toBe('#6ea8fe')
  })

  it('returns grey for 59 (just below blue threshold)', () => {
    expect(getMatchScoreStyle(59).color).toBe(GREY_COLOR)
    expect(getMatchScoreStyle(59).bg).toBe('rgba(156,163,175,0.1)')
  })

  it('returns grey for 0', () => {
    expect(getMatchScoreStyle(0).color).toBe(GREY_COLOR)
  })

  it('returns grey for negative score (pending/failed sentinel)', () => {
    expect(getMatchScoreStyle(-1).color).toBe(GREY_COLOR)
  })

  it('null path is distinct from low-score grey path', () => {
    expect(getMatchScoreStyle(null).bg).not.toBe(getMatchScoreStyle(0).bg)
  })
})
