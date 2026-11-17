import { useState } from 'react'
import { TypeIcon } from '../TypeIcon'
import { isLive, fmt12, fmtDate } from '../../utils/dateUtils'
import { roundDisplayName, resolveTypeLabel } from '../../utils/interviewUtils'
import type { InterviewWithDetails } from '../../../../recruiter/candidates/api/interviewsApi'

function getStatusLabel(live: boolean, status: string, hasFeedback: boolean, isPast: boolean): string {
  if (live) return 'LIVE'
  if (status === 'Completed') return hasFeedback ? 'Done' : 'Feedback Pending'
  if (isPast) return 'Missed'
  return 'Upcoming'
}

function getStatusColor(live: boolean, status: string, hasFeedback: boolean, isPast: boolean): string {
  if (live) return '#48BB78'
  if (status === 'Completed') return hasFeedback ? '#4ade80' : '#F6AD55'
  if (isPast) return '#f87171'
  return 'rgba(255,255,255,0.35)'
}

function getBorderColor(live: boolean, hovered: boolean): string {
  if (live) return 'rgba(72,187,120,0.3)'
  if (hovered) return 'rgba(255,255,255,0.1)'
  return 'rgba(255,255,255,0.06)'
}

function getOuterBoxShadow(live: boolean, hovered: boolean): string {
  if (live) return '0 0 28px rgba(72,187,120,0.08)'
  if (hovered) return '0 8px 32px rgba(0,0,0,0.4)'
  return 'none'
}

function getInnerBackground(live: boolean, hovered: boolean): string {
  if (hovered && live) return 'rgba(72,187,120,0.04)'
  if (hovered) return '#1a1b1f'
  return '#161719'
}

export function InterviewCard({ interview, onClick }: Readonly<{ interview: InterviewWithDetails; onClick: () => void }>) {
  const [hovered, setHovered] = useState(false)
  const live = isLive(interview.scheduledAt, interview.durationMinutes)
  const initials = (interview.candidateName ?? 'C').charAt(0).toUpperCase()
  const endTime = new Date(new Date(interview.scheduledAt).getTime() + interview.durationMinutes * 60000)
  const isPast = !live && endTime < new Date()
  const hasFeedback = interview.overallRating !== null

  const statusLabel = getStatusLabel(live, interview.status, hasFeedback, isPast)
  const statusColor = getStatusColor(live, interview.status, hasFeedback, isPast)

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer w-full text-left"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${getBorderColor(live, hovered)}`,
        borderRadius: 16,
        padding: '3px',
        transition: 'border-color 150ms, box-shadow 200ms',
        boxShadow: getOuterBoxShadow(live, hovered),
      }}
    >
      <div
        className="rounded-[13px] px-4 py-3.25"
        style={{
          background: getInnerBackground(live, hovered),
          transition: 'background 150ms',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-3">

          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(124,109,250,0.15)',
            border: '1.5px solid rgba(124,109,250,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: '#a78bfa',
          }}>
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.75">
              <span className="text-[14px] font-semibold text-white truncate">
                {interview.candidateName ?? 'Candidate'}
              </span>
              {live && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  fontSize: 9, fontWeight: 700, color: '#48BB78',
                  background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.25)',
                  borderRadius: 999, padding: '2px 8px', letterSpacing: '0.08em',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#48BB78', animation: 'pulse-dot 1.8s ease-in-out infinite' }} />
                  <span>LIVE</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap" style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>
              <span>{roundDisplayName(interview)}</span>
              <span>·</span>
              <TypeIcon type={interview.interviewType} size={11} style={{ flexShrink: 0 }} />
              <span>{resolveTypeLabel(interview.interviewType)}</span>
              {interview.jobTitle && (
                <>
                  <span>·</span>
                  <span className="truncate">{interview.jobTitle}</span>
                </>
              )}
            </div>
          </div>

          {/* Time + status */}
          <div className="flex flex-col items-end gap-0.75 shrink-0">
            <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {fmt12(interview.scheduledAt)}
            </span>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {fmtDate(interview.scheduledAt)}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: statusColor }}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
