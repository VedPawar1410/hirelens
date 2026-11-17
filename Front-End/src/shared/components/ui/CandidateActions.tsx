import { ActionButton } from './ActionButton'
import { NEXT_LABEL } from '../../lib/candidateUtils'
import type { CandidateStatus } from '../../types'

export function CandidateActions({
  status,
  onNextStage,
  onShortlist,
  onReject,
  rejectMarginAuto,
  isNextDisabled,
}: Readonly<{
  status: CandidateStatus
  onNextStage: () => void
  onShortlist: () => void
  onReject: () => void
  rejectMarginAuto?: boolean
  isNextDisabled?: boolean
}>): React.ReactElement {
  if (status === 'selected') {
    return (
      <span
        className="inline-block py-1 px-2.5 rounded-[20px] text-xs font-medium whitespace-nowrap"
        style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
      >
        Hired
      </span>
    )
  }

  if (status === 'rejected') {
    return (
      <span
        className="inline-block py-1 px-2.5 rounded-[20px] text-xs font-medium whitespace-nowrap"
        style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}
      >
        Rejected
      </span>
    )
  }

  const isPreShortlist = status === 'under_review' || status === 'filtered'
  const nextLabel = NEXT_LABEL[status] ?? 'Next Stage'

  let nextStageAction: React.ReactElement
  if (isPreShortlist) {
    nextStageAction = <ActionButton label="Shortlist" variant="primary" onClick={onShortlist} />
  } else if (isNextDisabled) {
    nextStageAction = (
      <div className="relative group">
        <ActionButton label={nextLabel} variant="primary" onClick={onNextStage} disabled />
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-150 z-9999"
          style={{ background: 'rgba(12,12,12,0.97)', color: '#93c5fd', fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(29,43,164,0.35)', letterSpacing: '0.01em' }}
        >
          Complete or skip all interview rounds first
        </span>
      </div>
    )
  } else {
    nextStageAction = <ActionButton label={nextLabel} variant="primary" onClick={onNextStage} />
  }

  return (
    <div className="flex items-center gap-1.5">
      {nextStageAction}
      <div className="relative group cursor-pointer" style={rejectMarginAuto ? { marginLeft: 'auto' } : undefined}>
        <button
          onClick={onReject}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.background = 'rgba(239,68,68,0.22)'
            el.style.borderColor = 'rgba(239,68,68,0.5)'
            el.style.color = '#fca5a5'
            el.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.3)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.background = 'rgba(239,68,68,0.08)'
            el.style.borderColor = 'rgba(239,68,68,0.15)'
            el.style.color = '#f87171'
            el.style.boxShadow = 'none'
          }}
          className="text-xs font-medium px-2.5 py-1 rounded-[20px] whitespace-nowrap cursor-pointer"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          Reject
        </button>
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-150 z-9999"
          style={{ background: 'rgba(12,12,12,0.97)', color: '#fca5a5', fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.25)', letterSpacing: '0.01em' }}
        >
          Permanently reject this candidate
        </span>
      </div>
    </div>
  )
}
