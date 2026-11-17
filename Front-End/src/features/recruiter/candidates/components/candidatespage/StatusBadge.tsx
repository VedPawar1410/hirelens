import { STATUS_BADGE } from '../../utils/candidateStatus'
import type { CandidateStatus } from '../../../../../shared/types/index'

export function StatusBadge({ status, compact }: { readonly status: CandidateStatus; readonly compact?: boolean }) {
  const badge = STATUS_BADGE[status]
  return (
    <span
      className={`inline-block rounded-[20px] font-medium whitespace-nowrap ${compact ? 'py-0.75 px-2 text-[11px] shrink-0' : 'py-1 px-2.5 text-xs'}`}
      style={{ color: badge.color, background: badge.bg }}
    >
      {badge.label}
    </span>
  )
}
