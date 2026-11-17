import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react'

import { useAuth } from '../../../../shared/hooks/useAuth'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'
import { useInterviewerData } from '../../hooks/useInterviewerData'
import { StatCard } from '../../../../shared/components/ui/StatCard'

import { useInterviewDetailModal } from '../hooks/useInterviewDetailModal'
import { InterviewCard } from '../components/dashboardpage/InterviewCard'
import { SectionHeader } from '../components/dashboardpage/SectionHeader'
import { StatsPanel } from '../components/dashboardpage/StatsPanel'
import { WeekStrip } from '../components/dashboardpage/WeekStrip'
import { CandidateDetailPage } from './CandidateDetailPage'
import { getGreeting, isLive, getWeekDays } from '../utils/dateUtils'
import type { InterviewWithDetails } from '../../../recruiter/candidates/api/interviewsApi'

function getPadding(isMobile: boolean, isTablet: boolean): string {
  if (isMobile) return 'px-4 pt-[14px] pb-[10px]'
  if (isTablet) return 'px-6 pt-5 pb-4'
  return 'px-8 pt-7 pb-5'
}

function getHeaderMarginClass(isMobile: boolean, isTablet: boolean): string {
  if (isMobile) return 'mb-[14px]'
  if (isTablet) return 'mb-5'
  return 'mb-6'
}

function getPendingFeedbackCount(interviews: InterviewWithDetails[]): number {
  return interviews.filter(i => i.status === 'Completed' && i.overallRating === null).length
}

function getUpcomingCount(interviews: InterviewWithDetails[], now: Date): number {
  return interviews.filter(i => {
    const endTime = new Date(new Date(i.scheduledAt).getTime() + i.durationMinutes * 60000)
    return i.status === 'Scheduled' && endTime > now
  }).length
}

function isMissed(i: InterviewWithDetails, now: Date): boolean {
  const endTime = new Date(new Date(i.scheduledAt).getTime() + i.durationMinutes * 60000)
  return i.status === 'Scheduled' && endTime <= now
}

function getMissedInterviews(interviews: InterviewWithDetails[], now: Date): InterviewWithDetails[] {
  return interviews
    .filter(i => isMissed(i, now))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
}

function getTodayInterviews(interviews: InterviewWithDetails[], activeDayStr: string, now: Date): InterviewWithDetails[] {
  return interviews
    .filter(i => new Date(i.scheduledAt).toDateString() === activeDayStr && !isMissed(i, now))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
}

function getNextInterview(interviews: InterviewWithDetails[], now: Date): InterviewWithDetails | null {
  return interviews
    .filter(i => i.status === 'Scheduled' && new Date(i.scheduledAt) > now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ?? null
}

function getLaterInterviews(interviews: InterviewWithDetails[], selectedDay: Date | null, now: Date): InterviewWithDetails[] {
  if (selectedDay) return []
  return interviews
    .filter(i => {
      const s = new Date(i.scheduledAt)
      const endTime = new Date(s.getTime() + i.durationMinutes * 60_000)
      return i.status === 'Scheduled' &&
        !isLive(i.scheduledAt, i.durationMinutes) &&
        s.toDateString() !== now.toDateString() &&
        endTime > now
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface DashboardStatCardsProps {
  readonly isLoading: boolean
  readonly total: number
  readonly completed: number
  readonly pendingFeedback: number
  readonly upcomingCount: number
  readonly isMobile: boolean
}

function DashboardStatCards({ isLoading, total, completed, pendingFeedback, upcomingCount, isMobile }: DashboardStatCardsProps) {
  const sz = isMobile ? 15 : 17
  const hasPending = pendingFeedback > 0
  return (
    <div
      className={`grid shrink-0 ${isMobile ? 'grid-cols-2 gap-2 mb-2.5' : 'grid-cols-4 gap-3 mb-3.5'}`}
      style={{ animation: 'fade-up 0.45s cubic-bezier(0.34,1.56,0.64,1) 60ms both' }}
    >
      <StatCard icon={<Calendar size={sz} style={{ color: '#a78bfa' }} />} iconBg="rgba(124,109,250,0.15)" value={isLoading ? null : total} label="Total Assigned" compact={isMobile} animDelay={60} />
      <StatCard icon={<CheckCircle size={sz} style={{ color: '#22c55e' }} />} iconBg="rgba(20,83,45,0.2)" value={isLoading ? null : completed} label="Completed" compact={isMobile} animDelay={120} />
      <StatCard
        icon={<Clock size={sz} style={{ color: hasPending ? '#F6AD55' : '#6b7280' }} />}
        iconBg={hasPending ? 'rgba(246,173,85,0.12)' : 'rgba(107,114,128,0.1)'}
        value={isLoading ? null : pendingFeedback}
        label="Feedback Due"
        accent={hasPending ? 'rgba(246,173,85,0.4)' : undefined}
        compact={isMobile}
        animDelay={180}
      />
      <StatCard icon={<TrendingUp size={sz} style={{ color: '#6ea8fe' }} />} iconBg="rgba(29,43,164,0.15)" value={isLoading ? null : upcomingCount} label="Upcoming" compact={isMobile} animDelay={240} />
    </div>
  )
}

interface InterviewListProps {
  readonly isLoading: boolean
  readonly interviews: InterviewWithDetails[]
  readonly missedInterviews: InterviewWithDetails[]
  readonly todayInterviews: InterviewWithDetails[]
  readonly laterInterviews: InterviewWithDetails[]
  readonly isActiveToday: boolean
  readonly activeDay: Date
  readonly openInterview: (iv: InterviewWithDetails) => void
}

function InterviewList({ isLoading, interviews, missedInterviews, todayInterviews, laterInterviews, isActiveToday, activeDay, openInterview }: InterviewListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 200 }}>
        <span className="btn-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
      </div>
    )
  }
  if (interviews.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-16 rounded-[14px]"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
      >
        <Calendar size={28} style={{ color: '#4b5563' }} />
        <p className="text-[14px] m-0" style={{ color: '#6b7280' }}>No interviews assigned yet</p>
      </div>
    )
  }
  const dayLabel = isActiveToday
    ? 'Today'
    : activeDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  return (
    <div className="flex flex-col gap-6">
      {missedInterviews.length > 0 && (
        <div>
          <SectionHeader label="Needs Action" color="#f87171" count={missedInterviews.length} />
          <div className="flex flex-col gap-2">
            {missedInterviews.map(i => (
              <InterviewCard key={i.interviewId} interview={i} onClick={() => openInterview(i)} />
            ))}
          </div>
        </div>
      )}
      {todayInterviews.length > 0 && (
        <div>
          <SectionHeader label={dayLabel} color={isActiveToday ? '#e2e8f0' : '#6ea8fe'} count={todayInterviews.length} />
          <div className="flex flex-col gap-2">
            {todayInterviews.map(i => (
              <InterviewCard key={i.interviewId} interview={i} onClick={() => openInterview(i)} />
            ))}
          </div>
        </div>
      )}
      {laterInterviews.length > 0 && (
        <div>
          <SectionHeader label="Later This Week" color="#a78bfa" count={laterInterviews.length} />
          <div className="flex flex-col gap-2">
            {laterInterviews.map(i => (
              <InterviewCard key={i.interviewId} interview={i} onClick={() => openInterview(i)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const { isMobile, isCompactTablet: isTablet, isDesktop: showRightPanel } = useBreakpoints()
  const { selectedInterview, feedbackKey, openInterview, closeInterview, handleFeedbackSuccess } = useInterviewDetailModal()
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const { interviews, isLoading } = useInterviewerData(user?.id)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const activeDay = selectedDay ?? now
  const activeDayStr = activeDay.toDateString()
  const isActiveToday = activeDayStr === now.toDateString()

  const total = interviews.length
  const completed = interviews.filter(i => i.status === 'Completed').length
  const pendingFeedback = getPendingFeedbackCount(interviews)
  const upcomingCount = getUpcomingCount(interviews, now)
  const weekDays = getWeekDays(interviews, now)
  const missedInterviews = getMissedInterviews(interviews, now)
  const todayInterviews = getTodayInterviews(interviews, activeDayStr, now)
  const nextInterview = getNextInterview(interviews, now)
  const laterInterviews = getLaterInterviews(interviews, selectedDay, now)

  if (!user) return null

  if (selectedInterview) {
    return (
      <div className={`min-h-screen ${isMobile ? 'p-4' : 'p-6'}`}>
        <CandidateDetailPage
          key={selectedInterview.interviewId + '-' + feedbackKey}
          interview={selectedInterview}
          onBack={closeInterview}
          onFeedbackSuccess={handleFeedbackSuccess}
        />
      </div>
    )
  }

  const interviewSuffix = interviews.length === 1 ? '' : 's'

  return (
    <div className={`relative z-1 flex flex-col overflow-y-auto overflow-x-hidden box-border ${getPadding(isMobile, isTablet)}`}>

      {/* Header */}
      <div
        className={`${getHeaderMarginClass(isMobile, isTablet)} shrink-0`}
        style={{ animation: 'fade-up 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        <div className="inline-flex items-center gap-1.5 mb-2 py-0.75 px-2.5 rounded-full bg-[rgba(124,109,250,0.12)] border border-[rgba(124,109,250,0.25)]">
          <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#a78bfa]">Interview Panel</span>
        </div>
        <h1 className="font-bold text-white m-0 tracking-[-0.015em]" style={{ fontSize: isMobile ? 22 : 26 }}>
          {getGreeting()}{user.name ? `, ${user.name.split(' ')[0]}` : ''}.
        </h1>
        <p className="text-sm mt-1.5 m-0 tracking-[0.01em]" style={{ color: '#9ca3af' }}>
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          {!isLoading && total > 0 && ` — ${total} interview${interviewSuffix} assigned`}
        </p>
      </div>

      <DashboardStatCards
        isLoading={isLoading}
        total={total}
        completed={completed}
        pendingFeedback={pendingFeedback}
        upcomingCount={upcomingCount}
        isMobile={isMobile}
      />

      {/* Two-column section */}
      <div className="flex gap-5 min-w-0">
        <div className="flex-1 min-w-0 flex flex-col">
          <WeekStrip weekDays={weekDays} activeDayStr={activeDayStr} setSelectedDay={setSelectedDay} isMobile={isMobile} />
          <div style={{ animation: 'fade-up 0.45s cubic-bezier(0.34,1.56,0.64,1) 180ms both' }}>
            <InterviewList
              isLoading={isLoading}
              interviews={interviews}
              missedInterviews={missedInterviews}
              todayInterviews={todayInterviews}
              laterInterviews={laterInterviews}
              isActiveToday={isActiveToday}
              activeDay={activeDay}
              openInterview={openInterview}
            />
          </div>
        </div>
        {showRightPanel && (
          <div className="w-68 shrink-0" style={{ animation: 'fade-up 0.45s cubic-bezier(0.34,1.56,0.64,1) 80ms both' }}>
            <StatsPanel interviews={interviews} nextInterview={nextInterview} onOpenCandidate={openInterview} />
          </div>
        )}
      </div>
    </div>
  )
}
