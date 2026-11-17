import type { InterviewWithDetails } from '../../../recruiter/candidates/api/interviewsApi'

export function getWeekDays(interviews: InterviewWithDetails[], now: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() + (i - 2))
    const sameDayInterviews = interviews.filter(iv => {
      const s = new Date(iv.scheduledAt)
      return s.getFullYear() === d.getFullYear() &&
        s.getMonth() === d.getMonth() &&
        s.getDate() === d.getDate()
    })
    const hasLive = sameDayInterviews.some(iv => isLive(iv.scheduledAt, iv.durationMinutes))
    return { date: d, count: sameDayInterviews.length, hasLive, isToday: i === 2, isPast: i < 2 }
  })
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const hours = Math.floor(diffMs / 3_600_000)
  const days = Math.floor(diffMs / 86_400_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours} hr ago`
  if (days === 1) return `yesterday, ${fmt12(dateStr)}`
  return `${days} days ago`
}

export { getGreeting } from '../../../../shared/lib/dateUtils'

export function fmt12(dt: string) {
  return new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function isLive(scheduledAt: string, durationMinutes: number) {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60000)
  const now = new Date()
  return start <= now && now <= end
}
