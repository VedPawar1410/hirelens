import type { CandidateStatus } from '../types/index'
import { STAGE_ORDER } from '../../features/recruiter/candidates/utils/candidateStatus'

export function getNextStageType(
  currentStatus: CandidateStatus | undefined,
): 'interviewing' | 'selected' | 'other' {
  if (!currentStatus) return 'other'
  const idx = STAGE_ORDER.indexOf(currentStatus)
  if (idx === -1) return 'other'
  const next = STAGE_ORDER[idx + 1]
  if (next === 'interviewing') return 'interviewing'
  if (next === 'selected') return 'selected'
  return 'other'
}
