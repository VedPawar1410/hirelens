import { Avatar } from '../../../../../shared/components/ui/Avatar'
import { MatchBadge } from '../../../../../shared/components/ui/MatchBadge'
import { CandidateActions } from '../../../../../shared/components/ui/CandidateActions'
import { StatusBadge } from './StatusBadge'
import type { ReactElement } from 'react'
import type { Candidate } from '../../../../../shared/types'

export interface CandidateCardProps {
  readonly candidate: Candidate
  readonly isLast: boolean
  readonly onNextStage: (id: string) => void
  readonly onShortlist: (id: string) => void
  readonly onReject: (id: string) => void
  readonly onView: (candidate: Candidate) => void
  readonly isNextDisabled?: boolean
}

export function CandidateCard({
  candidate,
  isLast,
  onNextStage,
  onShortlist,
  onReject,
  onView,
  isNextDisabled,
}: CandidateCardProps): ReactElement {
  return (
    <button
      type="button"
      onClick={() => onView(candidate)}
      className={`w-full text-left py-3.5 px-4 cursor-pointer bg-transparent border-0 p-0 ${isLast ? '' : 'border-b border-[#37373f]'}`}
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <Avatar name={candidate.name} avatarUrl={candidate.avatarUrl} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white m-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {candidate.name}
            </p>
            <StatusBadge status={candidate.status} compact />
          </div>
          <p className="text-xs text-[#9ca3af] mt-0.5 m-0">{candidate.currentRole}</p>
        </div>

        <div className="shrink-0">
          <MatchBadge score={candidate.matchScore} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white m-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {candidate.appliedJob?.title ?? '—'}
          </p>
          <p className="text-[11px] text-[#6b7280] mt-px m-0">{candidate.applicationSource}</p>
        </div>
        <p className="text-xs text-[#9ca3af] shrink-0 m-0">{candidate.appliedDate}</p>
      </div>

      {candidate.isDuplicate && (
        <div className="mb-2.5">
          <span className="inline-block py-0.5 px-1.75 bg-[rgba(217,119,6,0.15)] border border-[rgba(217,119,6,0.3)] text-[#fbbf24] text-[11px] rounded-sm">
            Duplicate Application
          </span>
        </div>
      )}

      <div role="none" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
        <CandidateActions
          status={candidate.status}
          onNextStage={() => onNextStage(candidate.id)}
          onShortlist={() => onShortlist(candidate.id)}
          onReject={() => onReject(candidate.id)}
          rejectMarginAuto
          isNextDisabled={isNextDisabled}
        />
      </div>
    </button>
  )
}
