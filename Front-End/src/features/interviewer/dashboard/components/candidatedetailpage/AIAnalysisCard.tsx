import { Bot } from 'lucide-react'
import { BezelCard, SectionTitle } from '../../../../../shared/components/ui/BezelCard'
import { getMatchScoreStyle } from '../../../../../shared/lib/matchScoreUtils'
import type { CandidateDetail } from '../../../../../shared/types/index'

export function AIAnalysisCard({
  matchScore,
  skills,
  candidate,
  isMobile,
}: {
  readonly matchScore: number | null
  readonly skills: string[]
  readonly candidate: CandidateDetail | null
  readonly isMobile: boolean
}) {
  const { color: matchColor, bg: matchBg } = getMatchScoreStyle(matchScore)
  return (
    <BezelCard>
      <div className="flex items-center gap-2 mb-5">
        <Bot size={16} style={{ color: '#6ea8fe' }} />
        <span className="text-[14px] font-semibold text-white">AI Analysis Engine</span>
      </div>
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <div>
          <SectionTitle>JD Match Score</SectionTitle>
          {matchScore === null ? (
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(156,163,175,0.08)' }}>
                <Bot size={18} style={{ color: '#6b7280' }} />
              </div>
              <span className="text-[13px]" style={{ color: '#6b7280' }}>Not analyzed yet</span>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <span className="text-[52px] font-bold leading-none tracking-[-0.03em]" style={{ color: matchColor }}>
                {matchScore}%
              </span>
              <div className="mb-2 inline-flex items-center justify-center w-8 h-8 rounded-full" style={{ background: matchBg }}>
                <Bot size={14} style={{ color: matchColor }} />
              </div>
            </div>
          )}
        </div>
        <div>
          <SectionTitle>Verified Skills</SectionTitle>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <span key={skill} className="py-1 px-2.5 rounded-md text-[12px] font-medium"
                  style={{ color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.08)' }}>
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[13px] m-0" style={{ color: '#6b7280' }}>No skills recorded.</p>
          )}
        </div>
      </div>

      {(candidate !== null && (candidate.experience !== null || candidate.education)) && (
        <div className={`grid gap-4 mt-5 pt-5 border-t border-[#2a2b2e] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {candidate.experience !== null && (
            <div>
              <SectionTitle>Experience</SectionTitle>
              <p className="text-[15px] font-semibold text-white m-0">
                {candidate.experience} {candidate.experience === 1 ? 'year' : 'years'}
              </p>
            </div>
          )}
          {candidate?.education && (
            <div>
              <SectionTitle>Education</SectionTitle>
              <p className="text-[15px] font-semibold text-white m-0">{candidate.education}</p>
            </div>
          )}
        </div>
      )}
    </BezelCard>
  )
}
