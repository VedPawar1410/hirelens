import { FileText, ArrowRight } from 'lucide-react'
import { Avatar } from '../../../../../shared/components/ui/Avatar'
import { usePdfBlobUrl } from '../../../../../shared/hooks/usePdfBlobUrl'
import { ScoreBadge } from './ScoreBadge'
import { getNextStageLabel, STAGE_ORDER } from '../../utils/jobFolderUtils'
import type { Candidate } from '../../../../../shared/types/index'

export interface CandidateDetailPanelProps {
  readonly candidate: Candidate
  readonly resumeBase64: string | null
  readonly resumeFileName: string | null
  readonly isResumeLoading?: boolean
  readonly onNextStage: (id: string) => void
  readonly onPrevStage: (id: string) => void
  readonly onReject: (id: string) => void
  readonly onViewProfile: () => void
  readonly isMoving: boolean
  readonly isMovingBack: boolean
  readonly canAdvance?: boolean
}

interface CandidateActionButtonsProps {
  readonly candidateId: string
  readonly isRejected: boolean
  readonly isMoving: boolean
  readonly isMovingBack: boolean
  readonly nextLabel: string | null
  readonly canGoBack: boolean
  readonly isNextBlocked: boolean
  readonly onNextStage: (id: string) => void
  readonly onPrevStage: (id: string) => void
  readonly onReject: (id: string) => void
}

function CandidateActionButtons({
  candidateId, isRejected, isMoving, isMovingBack,
  nextLabel, canGoBack, isNextBlocked,
  onNextStage, onPrevStage, onReject,
}: CandidateActionButtonsProps) {
  if (isRejected) {
    return (
      <button
        onClick={() => onPrevStage(candidateId)}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 8,
          borderTop: '1px solid rgba(156,163,175,0.2)',
          borderRight: '1px solid rgba(156,163,175,0.2)',
          borderBottom: '1px solid rgba(156,163,175,0.2)',
          borderLeft: '1px solid rgba(156,163,175,0.2)',
          background: 'transparent',
          color: 'rgba(156,163,175,0.75)', fontSize: 13, fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        {isMovingBack ? '…' : 'Restore'}
      </button>
    )
  }

  const nextBg = isNextBlocked ? 'rgba(29,43,164,0.35)' : '#1d2ba4'

  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
      {nextLabel && (
        <div className={isNextBlocked ? 'relative group flex-1' : undefined} style={isNextBlocked ? undefined : { flex: 1 }}>
          <button
            onClick={() => { if (!isNextBlocked) onNextStage(candidateId) }}
            disabled={isNextBlocked}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: 'none', background: nextBg,
              color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: isNextBlocked ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              boxShadow: isNextBlocked ? 'none' : '0 4px 12px rgba(29,43,164,0.4)',
              transition: 'background 150ms',
              opacity: isNextBlocked ? 0.45 : 1,
            }}
            onMouseEnter={e => { if (!isNextBlocked) e.currentTarget.style.background = '#12219e' }}
            onMouseLeave={e => { e.currentTarget.style.background = nextBg }}
          >
            {isMoving ? '…' : <><span>Move to {nextLabel}</span><ArrowRight size={12} /></>}
          </button>
          {isNextBlocked && (
            <span
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-150 z-9999"
              style={{ background: 'rgba(12,12,12,0.97)', color: '#93c5fd', fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(29,43,164,0.35)', letterSpacing: '0.01em' }}
            >
              Complete or skip all interview rounds first
            </span>
          )}
        </div>
      )}
      {canGoBack && !nextLabel && (
        <button
          onClick={() => onPrevStage(candidateId)}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            borderTop: '1px solid rgba(255,255,255,0.12)',
            borderRight: '1px solid rgba(255,255,255,0.12)',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            borderLeft: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {isMovingBack ? '…' : 'Previous Stage'}
        </button>
      )}
      <div className="relative group cursor-pointer">
        <button
          onClick={() => onReject(candidateId)}
          className="text-xs font-medium px-2.5 py-1 rounded-[20px] whitespace-nowrap cursor-pointer"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)', transition: 'background 150ms, border-color 150ms, box-shadow 150ms' }}
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
        >
          Reject
        </button>
        <span
          className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-150 z-9999"
          style={{ background: 'rgba(12,12,12,0.97)', color: '#fca5a5', fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.25)', letterSpacing: '0.01em' }}
        >
          Permanently reject this candidate
        </span>
      </div>
    </div>
  )
}

export function CandidateDetailPanel({
  candidate,
  resumeBase64, resumeFileName, isResumeLoading = false,
  onNextStage, onPrevStage, onReject, onViewProfile,
  isMoving, isMovingBack, canAdvance = true,
}: CandidateDetailPanelProps) {
  const resumeBlobUrl = usePdfBlobUrl(resumeBase64)
  const isRejected = candidate.status === 'rejected'
  const nextLabel = getNextStageLabel(candidate.status)
  const canGoBack = STAGE_ORDER.slice(1).includes(candidate.status)
  const isNextBlocked = !canAdvance && candidate.status === 'interviewing'

  let resumeContent
  if (resumeBlobUrl) {
    resumeContent = (
      <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', background: '#fff', minHeight: 0 }}>
        <iframe
          src={`${resumeBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          title={resumeFileName ?? 'Resume'}
        />
      </div>
    )
  } else if (isResumeLoading) {
    resumeContent = (
      <div style={{
        flex: 1, borderRadius: 10, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
        background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
      }}>
        <FileText size={24} style={{ color: '#4b5563' }} />
        <p style={{ margin: 0, fontSize: 12, color: '#4b5563' }}>Loading resume...</p>
      </div>
    )
  } else {
    resumeContent = (
      <div style={{
        flex: 1, borderRadius: 10, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
        background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
      }}>
        <FileText size={24} style={{ color: '#4b5563' }} />
        <p style={{ margin: 0, fontSize: 12, color: '#4b5563' }}>No resume available</p>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1, minWidth: 0,
      borderLeft: '1px solid #37373f',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: '#0f1012',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 14 }}>
          <Avatar name={candidate.name} avatarUrl={candidate.avatarUrl} size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <p style={{
                margin: 0, fontSize: 14, fontWeight: 700, color: '#f3f4f6',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {candidate.name}
              </p>
              {candidate.matchScore !== null && (
                <ScoreBadge score={candidate.matchScore} />
              )}
            </div>
            <p style={{
              margin: 0, fontSize: 12, color: '#6b7280',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {candidate.currentRole}
            </p>
            {candidate.currentRound && (
              <span style={{
                display: 'inline-block', marginTop: 6,
                fontSize: 11, fontWeight: 600, color: '#fbbf24',
                background: 'rgba(251,191,36,0.12)', borderRadius: 6, padding: '2px 8px',
              }}>
                Current round: {candidate.currentRound}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <CandidateActionButtons
          candidateId={candidate.id}
          isRejected={isRejected}
          isMoving={isMoving}
          isMovingBack={isMovingBack}
          nextLabel={nextLabel}
          canGoBack={canGoBack}
          isNextBlocked={isNextBlocked}
          onNextStage={onNextStage}
          onPrevStage={onPrevStage}
          onReject={onReject}
        />

        <button
          onClick={onViewProfile}
          style={{
            marginTop: 10, width: '100%', padding: '5px',
            border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.28)', fontSize: 11,
            cursor: 'pointer', textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          View full profile →
        </button>
      </div>

      {/* Resume */}
      <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <p style={{
          margin: 0, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.22)',
        }}>
          Resume
        </p>
        {resumeContent}
      </div>
    </div>
  )
}
