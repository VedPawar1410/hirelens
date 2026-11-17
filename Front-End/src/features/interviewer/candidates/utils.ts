import { fmt12, fmtDate } from '../dashboard/utils/dateUtils'
import type { InterviewWithDetails } from '../../recruiter/candidates/api/interviewsApi'
import type { GroupKey } from './types'

export function formatRelativeDate(scheduledAt: string): string {
  const now = new Date()
  const date = new Date(scheduledAt)
  let prefix: string
  if (date.toDateString() === now.toDateString()) prefix = 'Today'
  else if (date.toDateString() === new Date(now.getTime() + 86400000).toDateString()) prefix = 'Tomorrow'
  else prefix = fmtDate(scheduledAt)
  return `${prefix} · ${fmt12(scheduledAt)}`
}

export function groupInterviews(interviews: InterviewWithDetails[]) {
  const now = new Date()
  const feedback: InterviewWithDetails[] = []
  const upcoming: InterviewWithDetails[] = []
  const past: InterviewWithDetails[] = []

  for (const iv of interviews) {
    const endTime = new Date(new Date(iv.scheduledAt).getTime() + iv.durationMinutes * 60000)
    if (iv.status === 'Completed' && iv.overallRating === null) {
      feedback.push(iv)
    } else if (iv.status === 'Scheduled' && endTime > now) {
      upcoming.push(iv)
    } else {
      // Catch-all so no interview is silently dropped from every group while still
      // counting toward "All": rated-completed, plus missed/overdue scheduled rounds
      // the interviewer never took, cancellations, and no-shows — all reference-only.
      past.push(iv)
    }
  }

  feedback.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  upcoming.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  past.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

  return { feedback, upcoming, past }
}

export function getRoundDotColor(dotPos: number, interviewRound: number, groupKey: GroupKey): string {
  if (dotPos < interviewRound) return '#4ade80'
  if (dotPos === interviewRound) {
    if (groupKey === 'feedback') return '#F6AD55'
    if (groupKey === 'upcoming') return '#818cf8'
    return '#4ade80'
  }
  return 'rgba(255,255,255,0.1)'
}
