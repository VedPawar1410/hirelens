import { Briefcase, AlertTriangle, Calendar } from 'lucide-react'
import { Avatar } from '../../../../../shared/components/ui/Avatar'
import { STATUS_BADGE } from '../../../../recruiter/candidates/utils/candidateStatus'
import { BezelCard } from '../../../../../shared/components/ui/BezelCard'
import { AtsBadge } from '../../../../../shared/components/ui/AtsBadge'
import { CandidateContactLinks } from '../../../../../shared/components/ui/CandidateContactLinks'
import type { InterviewWithDetails } from '../../../../recruiter/candidates/api/interviewsApi'
import type { CandidateDetail } from '../../../../../shared/types/index'

export function CandidateHeader({
  interview,
  candidate,
  matchScore,
  isMobile,
}: Readonly<{
  interview: InterviewWithDetails
  candidate: CandidateDetail | null
  matchScore: number | null
  isMobile: boolean
}>) {
  const currentStatus = candidate?.status ?? 'under_review'
  const badge = STATUS_BADGE[currentStatus]

  return (
    <BezelCard className="mb-4">
      <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-row items-start'}`}>
        <Avatar
          name={interview.candidateName ?? 'C'}
          avatarUrl={candidate?.avatarUrl ?? null}
          size={isMobile ? 52 : 64}
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-[20px] font-bold text-white tracking-[-0.02em] m-0">
              {interview.candidateName ?? 'Candidate'}
            </h1>
            {candidate?.isDuplicate && (
              <span
                className="inline-flex items-center gap-1 py-0.5 px-2 text-[11px] rounded-sm"
                style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)', color: '#fbbf24' }}
              >
                <AlertTriangle size={10} />
                Duplicate
              </span>
            )}
            <div className="inline-flex items-center gap-2" style={{ marginLeft: 'auto' }}>
              <AtsBadge score={matchScore} />
              {badge && (
                <span
                  className="inline-block py-1.25 px-3.5 rounded-[20px] text-[12px] font-semibold whitespace-nowrap"
                  style={{ color: badge.color, background: badge.bg }}
                >
                  {badge.label}
                </span>
              )}
            </div>
          </div>

          <p className="text-[14px] m-0 mb-2.5" style={{ color: '#9ca3af' }}>
            {candidate?.currentRole ?? interview.candidateRole ?? interview.jobTitle ?? '—'}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-1">
            {candidate?.applicationSource && (
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: '#6b7280' }}>
                <Briefcase size={12} />
                <span>{candidate.applicationSource}</span>
              </div>
            )}
            {candidate?.appliedDate && (
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: '#6b7280' }}>
                <Calendar size={12} />
                <span>{candidate.appliedDate}</span>
              </div>
            )}
            {candidate?.appliedJob && (
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: '#6b7280' }}>
                <Briefcase size={12} />
                <span>{candidate.appliedJob.title}</span>
              </div>
            )}
          </div>

          <CandidateContactLinks
            email={candidate?.email}
            phone={candidate?.phone}
            linkedIn={candidate?.linkedIn}
            gitHub={candidate?.gitHub}
          />
        </div>
      </div>
    </BezelCard>
  )
}
