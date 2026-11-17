import { useMemo } from 'react'
import { Sparkline } from '../../../../../shared/components/ui/Sparkline'
import { roundDisplayName } from '../../utils/interviewUtils'
import { timeAgo } from '../../utils/dateUtils'
import type { InterviewWithDetails } from '../../../../recruiter/candidates/api/interviewsApi'

export function StatsPanel({
  interviews,
  nextInterview,
  onOpenCandidate,
}: Readonly<{
  interviews: InterviewWithDetails[]
  nextInterview: InterviewWithDetails | null
  onOpenCandidate: (iv: InterviewWithDetails) => void
}>) {
  const { thisMonth, avgRating, onTimePct, feedbackDays, weeklyData, isTrending, recentActivity } = useMemo(() => {
    const now = new Date()

    const thisMonth = interviews.filter(i => {
      const d = new Date(i.scheduledAt)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length

    const ratings = interviews.filter(i => i.overallRating !== null).map(i => i.overallRating as number)
    const avgRating = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null

    const completedInterviews = interviews.filter(i => i.status === 'Completed')
    const withFeedback = completedInterviews.filter(i => i.overallRating !== null)
    const onTimePct = completedInterviews.length > 0
      ? Math.round((withFeedback.length / completedInterviews.length) * 100)
      : null

    const feedbackDays = withFeedback.length > 0
      ? withFeedback.reduce((sum, iv) => {
          const days = (new Date(iv.updatedAt).getTime() - new Date(iv.scheduledAt).getTime()) / 86_400_000
          return sum + Math.max(days, 0)
        }, 0) / withFeedback.length
      : null

    const weeklyData: number[] = [0, 0, 0, 0]
    for (const iv of interviews) {
      const diffMs = now.getTime() - new Date(iv.scheduledAt).getTime()
      const weekIdx = Math.floor(diffMs / (7 * 86_400_000))
      if (weekIdx >= 0 && weekIdx < 4) weeklyData[3 - weekIdx]++
    }
    const isTrending = weeklyData[3] >= weeklyData[2]

    const recentActivity = [...withFeedback]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4)

    return { thisMonth, avgRating, onTimePct, feedbackDays, weeklyData, isTrending, recentActivity }
  }, [interviews])

  return (
    <div className="flex flex-col gap-4">
      {/* YOUR STATS */}
      <div className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-0.75">
        <div className="bg-[#161719] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#6b7280]">
              Your Stats
            </span>
            <span className="text-[10px]" style={{ color: '#4b5563' }}>Last 30 days</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-4">
            <div>
              <p className="text-[10px] text-[#6b7280] mb-1">This month</p>
              <p className="text-[22px] font-bold text-white leading-none [font-variant-numeric:tabular-nums]">
                {thisMonth}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#6b7280] mb-1">Avg rating given</p>
              <p className="text-[22px] font-bold text-white leading-none [font-variant-numeric:tabular-nums]">
                {avgRating ?? '—'}
                {avgRating && <span className="text-[13px] font-normal text-[#6b7280] ml-0.5">/5</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#6b7280] mb-1">On-time</p>
              <p className="text-[22px] font-bold text-white leading-none [font-variant-numeric:tabular-nums]">
                {onTimePct === null ? '—' : (
                  <>
                    {onTimePct}
                    <span className="text-[15px] font-bold text-white ml-px">%</span>
                  </>
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#6b7280] mb-1">Feedback in</p>
              <p className="text-[22px] font-bold text-white leading-none [font-variant-numeric:tabular-nums]">
                {feedbackDays === null ? '—' : (
                  <>
                    {feedbackDays.toFixed(1)}
                    <span className="text-[13px] font-normal text-[#6b7280] ml-0.5">d</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-[#6b7280] mb-2">Interviews / week</p>
            <Sparkline data={weeklyData} width="100%" height={44} color="#6ea8fe" />
            {isTrending && (
              <div
                className="mt-2 inline-flex items-center gap-1 px-2 py-0.75 rounded-full"
                style={{ background: 'rgba(110,168,254,0.1)', border: '1px solid rgba(110,168,254,0.2)' }}
              >
                <span className="text-[10px] font-medium" style={{ color: '#6ea8fe' }}>↑ trending</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      {recentActivity.length > 0 && (
        <div className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-0.75">
          <div className="bg-[#161719] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[#6b7280]">
                Recent activity
              </span>
              <span
                className="text-[10px] font-bold px-1.75 py-0.5 rounded-full leading-none"
                style={{ color: '#6b7280', background: 'rgba(107,114,128,0.15)' }}
              >
                {recentActivity.length}
              </span>
            </div>
            <div className="flex flex-col gap-3.5">
              {recentActivity.map(iv => (
                <div key={iv.interviewId} className="flex items-start gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.25 shrink-0"
                    style={{ background: '#4ade80' }}
                  />
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-white leading-tight">
                      Submitted feedback for {iv.candidateName ?? 'Candidate'}
                    </p>
                    <p className="text-[11px] mt-0.75 leading-tight" style={{ color: '#6b7280' }}>
                      {roundDisplayName(iv)}
                      {iv.jobTitle ? ` · ${iv.jobTitle}` : ''}
                      {' · '}
                      {timeAgo(iv.updatedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PREP TIP */}
      <div className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-0.75">
        <div className="bg-[#161719] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] px-4 py-4">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-[#6b7280] block mb-2">
            Prep tip
          </span>
          {nextInterview ? (
            <>
              <p className="text-[12px] leading-[1.6] mb-3" style={{ color: '#9ca3af' }}>
                {nextInterview.candidateName?.split(' ')[0]}&apos;s next round focuses on{' '}
                <span className="text-white font-medium">{nextInterview.jobTitle ?? 'this role'}</span>.
                {' '}Review their resume and skills before the session.
              </p>
              <button
                onClick={() => onOpenCandidate(nextInterview)}
                className="text-[11px] font-medium px-3 py-1.25 rounded-lg transition-colors duration-150"
                style={{
                  color: '#a78bfa',
                  background: 'rgba(124,109,250,0.1)',
                  border: '1px solid rgba(124,109,250,0.2)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,109,250,0.18)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,109,250,0.1)' }}
              >
                Open candidate
              </button>
            </>
          ) : (
            <p className="text-[12px] leading-[1.6]" style={{ color: '#9ca3af' }}>
              Take notes during the interview — specific examples help when writing feedback.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
