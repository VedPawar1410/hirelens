import {
  ArrowLeft, Briefcase, Calendar, FileText, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Avatar } from '../../../../../shared/components/ui/Avatar'
import { BezelCard } from '../../../../../shared/components/ui/BezelCard'
import { AtsBadge } from '../../../../../shared/components/ui/AtsBadge'
import { CandidateContactLinks } from '../../../../../shared/components/ui/CandidateContactLinks'
import type { Candidate } from '../../../../../shared/types/index'

interface Props {
  readonly candidate: Candidate
  readonly isMobile: boolean
  readonly fromJobFolder: boolean | undefined
  readonly prevId: string | null
  readonly nextId: string | null
  readonly badge: { label: string; color: string; bg: string }
  readonly onBack: () => void
  readonly onPrevCandidate: (id: string) => void
  readonly onNextCandidate: (id: string) => void
}

export function CandidateProfileHeader({
  candidate, isMobile, fromJobFolder,
  prevId, nextId, badge, onBack, onPrevCandidate, onNextCandidate,
}: Props) {
  const hasContact = !!(candidate.email || candidate.phone || candidate.linkedIn || candidate.gitHub)

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] cursor-pointer bg-transparent border-none p-0 transition-colors duration-150"
          style={{ color: '#9ca3af' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ffffff' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af' }}
        >
          <ArrowLeft size={14} />
          {fromJobFolder ? 'Back to Job Folder' : 'Back to Candidates'}
        </button>

        {fromJobFolder && (prevId || nextId) && (
          <div className="flex items-center gap-1.5">
            <button
              disabled={!prevId}
              onClick={() => prevId && onPrevCandidate(prevId)}
              className="flex items-center justify-center w-7 h-7 rounded-lg border bg-transparent cursor-pointer transition-colors duration-150"
              style={{ borderColor: prevId ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)', color: prevId ? '#9ca3af' : 'rgba(255,255,255,0.2)', cursor: prevId ? 'pointer' : 'default' }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={!nextId}
              onClick={() => nextId && onNextCandidate(nextId)}
              className="flex items-center justify-center w-7 h-7 rounded-lg border bg-transparent cursor-pointer transition-colors duration-150"
              style={{ borderColor: nextId ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)', color: nextId ? '#9ca3af' : 'rgba(255,255,255,0.2)', cursor: nextId ? 'pointer' : 'default' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <BezelCard className="mb-4">
        <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-row items-start'}`}>
          <Avatar name={candidate.name} avatarUrl={candidate.avatarUrl} size={isMobile ? 52 : 64} />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className="text-[20px] font-bold text-white tracking-[-0.02em] m-0">
                {candidate.name}
              </h1>
              {candidate.isDuplicate && (
                <span
                  className="inline-flex items-center gap-1 py-0.5 px-2 text-[11px] rounded-sm"
                  style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)', color: '#fbbf24' }}
                >
                  Duplicate
                </span>
              )}
              <div className="inline-flex items-center gap-2" style={{ marginLeft: 'auto' }}>
                <AtsBadge score={candidate.matchScore} />
                <span
                  className="inline-block py-1.25 px-3.5 rounded-[20px] text-[12px] font-semibold whitespace-nowrap"
                  style={{ color: badge.color, background: badge.bg }}
                >
                  {badge.label}
                </span>
              </div>
            </div>

            <p className="text-[14px] text-[#9ca3af] mb-2.5">{candidate.currentRole}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5 text-[12px] text-[#6b7280]">
                <Briefcase size={12} />
                <span>{candidate.applicationSource}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-[#6b7280]">
                <Calendar size={12} />
                <span>{candidate.appliedDate}</span>
              </div>
              {candidate.appliedJob && (
                <div className="flex items-center gap-1.5 text-[12px] text-[#6b7280]">
                  <FileText size={12} />
                  <span>{candidate.appliedJob.title}</span>
                </div>
              )}
            </div>

            {hasContact && (
              <CandidateContactLinks
                email={candidate.email}
                phone={candidate.phone}
                linkedIn={candidate.linkedIn}
                gitHub={candidate.gitHub}
              />
            )}
          </div>
        </div>
      </BezelCard>
    </>
  )
}
