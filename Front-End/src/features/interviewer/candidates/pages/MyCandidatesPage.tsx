import { useState, useMemo, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Search, AlertTriangle, Users } from 'lucide-react'

import { useAuth } from '../../../../shared/hooks/useAuth'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'
import { useInterviewerData } from '../../hooks/useInterviewerData'
import { useInterviewDetailModal } from '../../dashboard/hooks/useInterviewDetailModal'
import { CandidateDetailPage } from '../../dashboard/pages/CandidateDetailPage'
import { groupInterviews } from '../utils'
import { CandidateGroup } from '../components/mycandidatespage/CandidateGroup'
import { FilterChip, ScheduleViewButton, StartWithOldestButton } from '../components/mycandidatespage/FilterBar'
import { FILTER_LABELS } from '../types'
import type { FilterKey } from '../types'
import type { InterviewWithDetails } from '../../../recruiter/candidates/api/interviewsApi'

function SearchInput({ value, onChange, isMobile }: Readonly<{ value: string; onChange: (v: string) => void; isMobile: boolean }>) {
  if (isMobile) {
    return (
      <div className="flex items-center gap-2.5 bg-[#161719] border border-[#37373f] focus-within:border-[#4b5563] rounded-3xl px-4 flex-1 transition-colors duration-150">
        <Search style={{ width: 14, height: 14, color: '#6b7280', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search candidates"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="border-none bg-transparent text-[13px] text-[#d1d5db] placeholder-[#4b5563] py-2.25 w-full outline-none"
        />
      </div>
    )
  }
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 14, height: 14, color: '#6b7280' }} />
      <input
        type="text"
        placeholder="Search candidates"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm text-white outline-none placeholder:text-[#4b5563]"
        style={{
          paddingLeft: 36, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
          width: 190,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          color: '#fff',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,109,250,0.4)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
      />
    </div>
  )
}

export default function MyCandidatesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isMobile, isCompactTablet: isTablet } = useBreakpoints()

  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const onFeedbackSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['interviewer-interviews', user?.id] })
  }, [user?.id, queryClient])
  const { selectedInterview, feedbackKey, openInterview, closeInterview, handleFeedbackSuccess } = useInterviewDetailModal(onFeedbackSuccess)

  const { interviews, isLoading } = useInterviewerData(user?.id)
  const { feedback, upcoming, past } = useMemo(() => groupInterviews(interviews), [interviews])

  const applySearch = useCallback((list: InterviewWithDetails[]): InterviewWithDetails[] => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(iv =>
      iv.candidateName?.toLowerCase().includes(q) ||
      iv.jobTitle?.toLowerCase().includes(q) ||
      iv.candidateRole?.toLowerCase().includes(q)
    )
  }, [search])

  const filterCounts: Record<FilterKey, number> = useMemo(() => ({
    all: applySearch(interviews).length,
    feedback: applySearch(feedback).length,
    upcoming: applySearch(upcoming).length,
    past: applySearch(past).length,
  }), [applySearch, interviews, feedback, upcoming, past])

  const visibleFeedback = useMemo(
    () => (filter === 'all' || filter === 'feedback') ? applySearch(feedback) : [],
    [filter, applySearch, feedback],
  )
  const visibleUpcoming = useMemo(
    () => (filter === 'all' || filter === 'upcoming') ? applySearch(upcoming) : [],
    [filter, applySearch, upcoming],
  )
  const visiblePast = useMemo(
    () => (filter === 'all' || filter === 'past') ? applySearch(past) : [],
    [filter, applySearch, past],
  )
  const hasAny = visibleFeedback.length > 0 || visibleUpcoming.length > 0 || visiblePast.length > 0

  if (!user) return null

  // Detail view
  if (selectedInterview) {
    return (
      <div className={isMobile ? 'p-4' : 'px-8 pt-7 pb-8'}>
        <CandidateDetailPage
          key={selectedInterview.interviewId + '-' + feedbackKey}
          interview={selectedInterview}
          onBack={closeInterview}
          onFeedbackSuccess={handleFeedbackSuccess}
        />
      </div>
    )
  }

  const tabletPx = isTablet ? 'px-6' : 'px-8'
  const px = isMobile ? 'px-4' : tabletPx
  const pt = isMobile ? 'pt-[14px]' : 'pt-7'

  // Desktop table column headers depend on tablet vs desktop
  const tableHeaders = isTablet
    ? ['Candidate', 'Match', 'Next / action']
    : ['Candidate', 'Applied for', 'Match', 'Rounds', 'Next / action']
  const tableCols = isTablet ? '2fr 110px 1.3fr' : '2fr 1.4fr 100px 90px 1.3fr'

  return (
    <div className={`relative z-1 flex flex-col overflow-x-hidden box-border ${px} ${pt} pb-8 min-h-screen`}>

      {/* Header */}
      <div
        className={`mb-5 ${isMobile ? '' : 'flex items-start justify-between gap-4'}`}
        style={{ animation: 'fade-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        <div>
          <div className="inline-flex items-center gap-1.5 mb-2 py-0.75 px-2.5 rounded-full bg-[rgba(124,109,250,0.12)] border border-[rgba(124,109,250,0.25)]">
            <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#a78bfa]">
              Interview Panel
            </span>
          </div>
          <h1
            className="font-bold text-white m-0"
            style={{ fontSize: isMobile ? 22 : 26, letterSpacing: '-0.015em' }}
          >
            My Candidates
          </h1>
          <p className="text-sm mt-1.5 m-0" style={{ color: '#9ca3af' }}>
            Everyone you're interviewing, sorted by what needs you next.
          </p>
        </div>

        {/* Search + Schedule view — inline on tablet/desktop, stacked below on mobile */}
        {isMobile ? (
          <div className="mt-3 flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} isMobile={true} />
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <SearchInput value={search} onChange={setSearch} isMobile={false} />
            <ScheduleViewButton onClick={() => navigate({ to: '/interviewer/dashboard' })} />
          </div>
        )}
      </div>

      {/* Feedback banner */}
      {feedback.length > 0 && (
        <div
          className={`flex items-center gap-3 mb-4 rounded-xl ${isMobile ? 'px-3 py-2.5 flex-wrap' : 'px-4 py-2.75'}`}
          style={{
            background: 'rgba(246,173,85,0.07)',
            border: '1px solid rgba(246,173,85,0.2)',
            animation: 'fade-up 0.4s cubic-bezier(0.34,1.56,0.64,1) 60ms both',
          }}
        >
          <AlertTriangle style={{ width: 16, height: 16, color: '#F6AD55', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-white">
              {feedback.length} interview{feedback.length === 1 ? '' : 's'} waiting on your feedback
            </span>
            {!isMobile && (
              <span className="text-xs ml-2" style={{ color: 'rgba(246,173,85,0.65)' }}>
                Recruiters can't move these candidates forward until you submit notes &amp; rating.
              </span>
            )}
          </div>
          <StartWithOldestButton onClick={() => openInterview(feedback[0])} />
        </div>
      )}

      {/* Filter chips */}
      <div
        className="flex items-center gap-2 mb-4 overflow-x-auto"
        style={{ scrollbarWidth: 'none', animation: 'fade-up 0.4s cubic-bezier(0.34,1.56,0.64,1) 80ms both' }}
      >
        {(['all', 'feedback', 'upcoming', 'past'] as FilterKey[]).map(key => {
          const active = filter === key
          return (
            <FilterChip
              key={key}
              label={isMobile && key !== 'all' ? FILTER_LABELS[key].split(' ')[0] : FILTER_LABELS[key]}
              count={filterCounts[key]}
              active={active}
              onClick={() => setFilter(key)}
            />
          )
        })}
      </div>

      {/* Table / Card list */}
      {isLoading ? (
        <div className="flex items-center justify-center" style={{ height: 200 }}>
          <span className="btn-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
        </div>
      ) : (
        <div
          className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-0.75"
          style={{ animation: 'fade-up 0.4s cubic-bezier(0.34,1.56,0.64,1) 100ms both' }}
        >
          <div className="bg-[#161719] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] overflow-hidden">

            {/* Column headers — tablet/desktop only */}
            {!isMobile && (
              <div
                className="grid items-center px-5 py-3"
                style={{
                  gridTemplateColumns: tableCols,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {tableHeaders.map(col => (
                  <span
                    key={col}
                    className="text-[10px] font-semibold tracking-widest uppercase"
                    style={{ color: '#4b5563' }}
                  >
                    {col}
                  </span>
                ))}
              </div>
            )}

            {/* Groups */}
            {visibleFeedback.length > 0 && (
              <CandidateGroup
                label="Feedback pending"
                color="#F6AD55"
                items={visibleFeedback}
                groupKey="feedback"
                onSelect={openInterview}
                isMobile={isMobile}
                isTablet={isTablet}
              />
            )}
            {visibleUpcoming.length > 0 && (
              <CandidateGroup
                label="Upcoming with you"
                color="#a78bfa"
                items={visibleUpcoming}
                groupKey="upcoming"
                onSelect={openInterview}
                isMobile={isMobile}
                isTablet={isTablet}
              />
            )}
            {visiblePast.length > 0 && (
              <CandidateGroup
                label="Past – for reference"
                color="#6b7280"
                items={visiblePast}
                groupKey="past"
                onSelect={openInterview}
                isMobile={isMobile}
                isTablet={isTablet}
              />
            )}

            {!hasAny && (
              <div className="flex flex-col items-center justify-center gap-2 py-14">
                <Users style={{ width: 28, height: 28, color: '#374151' }} />
                <p className="text-sm m-0" style={{ color: '#4b5563' }}>
                  No candidates match this filter
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
