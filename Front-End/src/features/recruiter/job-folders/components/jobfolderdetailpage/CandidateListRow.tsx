import { useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Avatar } from '../../../../../shared/components/ui/Avatar'
import { ScoreBadge, SourceBadge } from './ScoreBadge'
import type { Candidate } from '../../../../../shared/types/index'

export interface CandidateListRowProps {
  readonly candidate: Candidate
  readonly isSelected: boolean
  readonly onClick: () => void
  readonly isComputingScores: boolean
}

export function CandidateListRow({ candidate, isSelected, onClick, isComputingScores }: CandidateListRowProps) {
  const rowRef = useRef<HTMLButtonElement>(null)

  const applyHover = () => {
    if (!rowRef.current || isSelected) return
    rowRef.current.style.background = 'rgba(255,255,255,0.04)'
  }
  const applyIdle = () => {
    if (!rowRef.current || isSelected) return
    rowRef.current.style.background = 'transparent'
  }

  return (
    <button
      ref={rowRef}
      type="button"
      onClick={onClick}
      onMouseEnter={applyHover}
      onMouseLeave={applyIdle}
      style={{
        width: '100%', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '11px 16px',
        background: isSelected ? 'rgba(29,43,164,0.14)' : 'transparent',
        borderTop: 'none', borderRight: 'none',
        borderLeft: `3px solid ${isSelected ? '#1d2ba4' : 'transparent'}`,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer', transition: 'background 100ms',
      }}
    >
      <Avatar name={candidate.name} avatarUrl={candidate.avatarUrl} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: '#e5e7eb',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {candidate.name}
          </span>
          {candidate.isDuplicate && <AlertTriangle size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 11, color: '#6b7280',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: 140,
          }}>
            {candidate.currentRole}
          </span>
          <SourceBadge source={candidate.applicationSource} />
          {candidate.currentRound && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: '#fbbf24',
              background: 'rgba(251,191,36,0.12)', borderRadius: 5,
              padding: '1px 6px', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {candidate.currentRound}
            </span>
          )}
        </div>
      </div>
      <ScoreBadge
        score={candidate.matchScore}
        isComputing={isComputingScores && candidate.matchScore === null}
      />
    </button>
  )
}
