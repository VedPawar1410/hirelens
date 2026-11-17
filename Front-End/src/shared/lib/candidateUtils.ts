import type { CandidateStatus } from '../types'

export const NEXT_LABEL: Record<CandidateStatus, string | undefined> = {
  under_review: undefined,
  filtered: undefined,
  shortlisted: 'Move to Interview',
  interviewing: 'Select',
  selected: undefined,
  rejected: undefined,
}
