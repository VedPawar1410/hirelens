import type { CandidateStatus } from '../../../../shared/types/index'
import { STAGE_ORDER } from '../../candidates/utils/candidateStatus'

export { STAGE_ORDER }

export const COLUMNS: Array<{ status: CandidateStatus; label: string }> = [
  { status: 'under_review', label: 'Under Review' },
  { status: 'filtered', label: 'Filtered' },
  { status: 'shortlisted', label: 'Shortlisted' },
  { status: 'interviewing', label: 'Interviewing' },
  { status: 'selected', label: 'Selected' },
  { status: 'rejected', label: 'Rejected' },
]

export { STATUS_BADGE as STATUS_CHIP } from '../../candidates/utils/candidateStatus'

export function getNextStageLabel(status: CandidateStatus): string | null {
  const idx = STAGE_ORDER.indexOf(status)
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null
  const next = STAGE_ORDER[idx + 1]
  return COLUMNS.find(c => c.status === next)?.label ?? null
}
