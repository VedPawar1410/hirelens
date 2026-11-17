import { describe, it, expect } from 'vitest'
import { NEXT_LABEL } from '../candidateUtils'
import type { CandidateStatus } from '../../types'

describe('NEXT_LABEL', () => {
  it('has an entry for every CandidateStatus value', () => {
    const allStatuses: CandidateStatus[] = [
      'under_review',
      'filtered',
      'shortlisted',
      'interviewing',
      'selected',
      'rejected',
    ]
    for (const s of allStatuses) {
      expect(s in NEXT_LABEL).toBe(true)
    }
  })

  it('returns undefined for terminal and pre-shortlist stages', () => {
    expect(NEXT_LABEL.under_review).toBeUndefined()
    expect(NEXT_LABEL.filtered).toBeUndefined()
    expect(NEXT_LABEL.selected).toBeUndefined()
    expect(NEXT_LABEL.rejected).toBeUndefined()
  })

  it('returns "Move to Interview" for shortlisted', () => {
    expect(NEXT_LABEL.shortlisted).toBe('Move to Interview')
  })

  it('returns "Select" for the interviewing stage', () => {
    expect(NEXT_LABEL.interviewing).toBe('Select')
  })
})
