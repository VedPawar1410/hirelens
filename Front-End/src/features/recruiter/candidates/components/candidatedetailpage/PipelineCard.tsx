import { BezelCard } from '../../../../../shared/components/ui/BezelCard'
import { PipelineBar } from '../../../../../shared/components/ui/PipelineBar'
import { STAGE_ORDER } from '../../utils/candidateStatus'
import type { CandidateStatus } from '../../../../../shared/types/index'

interface Props {
  readonly currentStatus: CandidateStatus
  readonly badge: { label: string; color: string; bg: string }
  readonly actionError: string | null
  readonly isActionPending: boolean
  readonly canGoBack: boolean
  readonly isPrevPending: boolean
  readonly isNextPending: boolean
  readonly isNextDisabled?: boolean
  readonly showPrevConfirm?: boolean
  readonly onPrev: () => void
  readonly onPrevConfirm?: () => void
  readonly onPrevCancel?: () => void
  readonly onNext: () => void
  readonly onReject: () => void
}

export function PipelineCard({
  currentStatus, badge, actionError, isActionPending,
  canGoBack, isPrevPending, isNextPending, isNextDisabled,
  showPrevConfirm, onPrev, onPrevConfirm, onPrevCancel, onNext, onReject,
}: Props) {
  const activeStageIdx = STAGE_ORDER.indexOf(currentStatus)

  return (
    <BezelCard>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ color: '#6ea8fe' }}>
          Pipeline Position
        </p>
        <span
          className="text-[11px] font-medium px-2 py-0.75 rounded-md"
          style={{ background: 'rgba(29,43,164,0.15)', color: '#6ea8fe', border: '1px solid rgba(110,168,254,0.2)' }}
        >
          {badge.label}
        </span>
      </div>

      <div className="mb-4">
        <PipelineBar activeStageIdx={activeStageIdx} />
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />

      {actionError && (
        <p className="text-[12px] mb-3 px-2.5 py-1.75 rounded-lg" style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {actionError}
        </p>
      )}

      {canGoBack && showPrevConfirm && (
        <div className="rounded-[9px] p-3 mb-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p className="text-[11px] mb-2.5 leading-relaxed" style={{ color: '#fca5a5' }}>
            Moving back will delete all interview round data. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onPrevCancel}
              disabled={isActionPending}
              className="flex-1 rounded-[7px] py-1.5 text-[12px] font-medium cursor-pointer disabled:opacity-40"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Cancel
            </button>
            <button
              onClick={onPrevConfirm}
              disabled={isActionPending}
              className="flex-1 rounded-[7px] py-1.5 text-[12px] font-semibold cursor-pointer disabled:opacity-40"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
              onMouseEnter={e => { if (!isActionPending) e.currentTarget.style.background = 'rgba(239,68,68,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
            >
              {isPrevPending ? '…' : 'Yes, move back'}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        {canGoBack && !showPrevConfirm && (
          <button
            onClick={onPrev}
            disabled={isActionPending}
            className="flex-1 rounded-[9px] py-2.25 text-[13px] font-medium cursor-pointer disabled:opacity-40"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            {isPrevPending ? '…' : '← Prev'}
          </button>
        )}
        <div className="relative group flex-1">
          <button
            onClick={onNext}
            disabled={isActionPending || currentStatus === 'selected' || isNextDisabled}
            className="w-full rounded-[9px] py-2.25 text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'rgba(29,43,164,0.2)', border: '1px solid rgba(110,168,254,0.3)', color: '#6ea8fe' }}
            onMouseEnter={e => { if (!isActionPending && currentStatus !== 'selected' && !isNextDisabled) e.currentTarget.style.background = 'rgba(29,43,164,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(29,43,164,0.2)' }}
          >
            {isNextPending ? '…' : 'Next Stage →'}
          </button>
          {isNextDisabled && (
            <span
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-150 z-50"
              style={{ background: 'rgba(12,12,12,0.97)', color: '#93c5fd', fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(29,43,164,0.35)', letterSpacing: '0.01em' }}
            >
              Complete or skip all interview rounds first
            </span>
          )}
        </div>
      </div>

      <div className="relative group cursor-pointer">
        <button
          onClick={() => { if (!isActionPending) onReject() }}
          disabled={isActionPending || currentStatus === 'rejected'}
          className="w-full text-center text-[12px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 py-1.25 rounded-[7px]"
          style={{ color: 'rgba(248,113,113,0.5)', background: 'transparent', border: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(248,113,113,0.5)' }}
        >
          ⚑ Reject candidate
        </button>
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-150 z-9999"
          style={{ background: 'rgba(12,12,12,0.97)', color: '#fca5a5', fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.25)', letterSpacing: '0.01em' }}
        >
          Permanently reject this candidate
        </span>
      </div>
    </BezelCard>
  )
}
