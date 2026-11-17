import { describe, it, expect } from 'vitest'
import { getNextStageType } from './stageUtils'

describe('getNextStageType', () => {
  it('returns other when currentStatus is undefined', () => {
    expect(getNextStageType(undefined)).toBe('other')
  })

  it('returns other when currentStatus is not in STAGE_ORDER', () => {
    // 'rejected' exists as a CandidateStatus but is excluded from STAGE_ORDER
    expect(getNextStageType('rejected')).toBe('other')
  })

  it('returns other when next stage is not interviewing or selected (under_review → filtered)', () => {
    expect(getNextStageType('under_review')).toBe('other')
  })

  it('returns other when next stage is not interviewing or selected (filtered → shortlisted)', () => {
    expect(getNextStageType('filtered')).toBe('other')
  })

  it('returns interviewing when next stage is interviewing (shortlisted → interviewing)', () => {
    expect(getNextStageType('shortlisted')).toBe('interviewing')
  })

  it('returns selected when next stage is selected (interviewing → selected)', () => {
    expect(getNextStageType('interviewing')).toBe('selected')
  })

  it('returns other when there is no next stage (selected is last)', () => {
    expect(getNextStageType('selected')).toBe('other')
  })
})
