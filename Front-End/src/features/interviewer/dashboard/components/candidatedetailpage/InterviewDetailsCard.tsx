import { Calendar, MapPin } from 'lucide-react'
import { BezelCard } from '../../../../../shared/components/ui/BezelCard'
import { TypeIcon } from '../TypeIcon'
import { fmt12 } from '../../utils/dateUtils'
import { roundDisplayName, resolveTypeLabel } from '../../utils/interviewUtils'
import { toSafeHttpUrl } from '../../../../../shared/lib/urlUtils'
import type { InterviewWithDetails } from '../../../../recruiter/candidates/api/interviewsApi'

export function InterviewDetailsCard({
  interview,
  live,
}: Readonly<{
  interview: InterviewWithDetails
  live: boolean
}>) {
  const safeMeetingLink = toSafeHttpUrl(interview.meetingLink)
  const stats = [
    roundDisplayName(interview),
    resolveTypeLabel(interview.interviewType),
    new Date(interview.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    fmt12(interview.scheduledAt),
    `${interview.durationMinutes} min`,
  ]

  return (
    <BezelCard>
      <div className="flex items-center gap-3 flex-wrap">
        <Calendar size={14} style={{ color: '#7C6DFA', flexShrink: 0 }} />

        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {stats.map((val, i) => (
            <span key={val} className="flex items-center gap-2">
              <span className="text-[13px] font-medium" style={{ color: i === 0 ? '#e2e8f0' : '#9ca3af' }}>{val}</span>
              {i < stats.length - 1 && (
                <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 12 }}>·</span>
              )}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {live && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 9, fontWeight: 700, color: '#48BB78',
              background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.25)',
              borderRadius: 999, padding: '3px 9px', letterSpacing: '0.08em',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#48BB78', animation: 'pulse-dot 1.8s ease-in-out infinite' }} />{' '}LIVE
            </span>
          )}
          {safeMeetingLink && (
            <a
              href={safeMeetingLink} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-[12px] font-semibold no-underline"
              style={{ background: 'rgba(124,109,250,0.15)', border: '1px solid rgba(124,109,250,0.35)', color: '#7C6DFA', transition: 'background 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,109,250,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,109,250,0.15)' }}
            >
              <TypeIcon type={interview.interviewType} size={12} />Join Call ↗
            </a>
          )}
          {interview.location && !safeMeetingLink && (
            <div className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-[12px]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
              <MapPin size={12} />{interview.location}
            </div>
          )}
        </div>
      </div>
    </BezelCard>
  )
}
