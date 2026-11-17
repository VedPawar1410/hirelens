import type { JDStatus } from '../../types/index'

// Each status maps to a distinct color so recruiters can scan the list at a glance.
const BADGE_CLASSES: Record<JDStatus, string> = {
  draft:     'bg-[#374151] text-[#d1d5db]',
  assigned:  'bg-[#78350f] text-[#fcd34d]',
  returned:  'bg-[#1e3a5f] text-[#93c5fd]',
  finalized: 'bg-[#14532d] text-[#86efac]',
}

export function StatusBadge({ status }: { readonly status: JDStatus }) {
  return (
    <span className={`${BADGE_CLASSES[status]} py-[2px] px-[10px] rounded-[6px] text-[11px] font-semibold capitalize tracking-[0.02em]`}>
      {status}
    </span>
  )
}
