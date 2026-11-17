import { describe, it, expect } from 'vitest'
import { STATUS_BADGE, STAGE_ORDER } from '../candidateStatus'
import type { CandidateStatus } from '../../../../../shared/types/index'

const STAGE_COUNT = 5

const ALL: CandidateStatus[] = [
  'under_review', 'filtered', 'shortlisted', 'interviewing',
  'selected', 'rejected',
]

describe('STATUS_BADGE', () => {
  it('has an entry for every CandidateStatus', () => {
    for (const s of ALL) expect(STATUS_BADGE[s]).toBeDefined()
  })
  it('every entry has label, color, bg', () => {
    for (const s of ALL) {
      expect(STATUS_BADGE[s].label).toBeTruthy()
      expect(STATUS_BADGE[s].color).toMatch(/^#/)
      expect(STATUS_BADGE[s].bg).toMatch(/^rgba/)
    }
  })
})

describe('STAGE_ORDER', () => {
  it('has 5 entries (excludes "rejected" terminal)', () => {
    expect(STAGE_ORDER).toHaveLength(STAGE_COUNT)
    expect(STAGE_ORDER).not.toContain('rejected')
  })
  it('starts at under_review and ends at selected', () => {
    expect(STAGE_ORDER[0]).toBe('under_review')
    expect(STAGE_ORDER.at(-1)).toBe('selected')
  })
})
