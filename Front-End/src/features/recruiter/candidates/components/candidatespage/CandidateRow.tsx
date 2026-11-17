import { Avatar } from '../../../../../shared/components/ui/Avatar'
import { MatchBadge } from '../../../../../shared/components/ui/MatchBadge'
import { CandidateActions } from '../../../../../shared/components/ui/CandidateActions'
import { StatusBadge } from './StatusBadge'
import type { ReactElement, CSSProperties } from 'react'
import type { Candidate } from '../../../../../shared/types'

export interface CandidateRowProps {
  readonly candidate: Candidate
  readonly isLast: boolean
  readonly isTablet: boolean
  readonly onNextStage: (id: string) => void
  readonly onShortlist: (id: string) => void
  readonly onReject: (id: string) => void
  readonly onView: (candidate: Candidate) => void
  readonly isNextDisabled?: boolean
  readonly style?: CSSProperties
  readonly innerRef?: (el: HTMLTableRowElement | null) => void
}

export function CandidateRow({
  candidate,
  isLast,
  isTablet,
  onNextStage,
  onShortlist,
  onReject,
  onView,
  isNextDisabled,
  style,
  innerRef,
}: CandidateRowProps): ReactElement {
  return (
    <tr
      ref={innerRef}
      tabIndex={0}
      onClick={() => onView(candidate)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onView(candidate) }}
      style={style}
      className={[
        'cursor-pointer transition-[background] duration-100 hover:bg-[rgba(255,255,255,0.015)]',
        isLast ? '' : 'border-b border-[#37373f]',
      ].join(' ')}
    >
      <td className={`py-3.5 ${isTablet ? 'px-4 max-w-40' : 'px-6'}`}>
        <div className="flex items-center gap-2.5">
          <Avatar name={candidate.name} avatarUrl={candidate.avatarUrl} />
          <div>
            <p className="text-sm font-semibold text-white mb-0.5">{candidate.name}</p>
            <p className="text-xs text-[#9ca3af]">{candidate.currentRole}</p>
            {candidate.isDuplicate && (
              <span className="inline-block mt-0.75 py-0.5 px-1.75 bg-[rgba(217,119,6,0.15)] border border-[rgba(217,119,6,0.3)] text-[#fbbf24] text-[11px] rounded-sm">
                Duplicate Application
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="py-3.5 px-4">
        <MatchBadge score={candidate.matchScore} />
      </td>

      <td className="py-3.5 px-4 overflow-hidden">
        <p
          className="text-[13px] font-semibold truncate"
          style={{ color: candidate.appliedJob ? '#ffffff' : '#6b7280' }}
          title={candidate.appliedJob?.title ?? undefined}
        >
          {candidate.appliedJob?.title ?? '—'}
        </p>
      </td>

      {!isTablet && (
        <td className="py-3.5 px-4">
          <p className="text-xs text-[#9ca3af] whitespace-nowrap">{candidate.applicationSource}</p>
        </td>
      )}

      <td className="py-3.5 px-4">
        <StatusBadge status={candidate.status} />
      </td>

      {!isTablet && (
        <td className="py-3.5 px-4">
          <p className="text-[13px] text-[#9ca3af]">{candidate.appliedDate}</p>
        </td>
      )}

      <td className={`py-3.5 pl-4 ${isTablet ? 'pr-3' : 'pr-6'}`}>
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="none">
          <CandidateActions
            status={candidate.status}
            onNextStage={() => onNextStage(candidate.id)}
            onShortlist={() => onShortlist(candidate.id)}
            onReject={() => onReject(candidate.id)}
            isNextDisabled={isNextDisabled}
          />
        </div>
      </td>
    </tr>
  )
}
