import { useState } from 'react'
import { Ban, Calendar, Clock, Link, Lock, MapPin, RotateCcw, Users } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDraftById } from '../../../jd-creation/api/jdApi'
import { getInterviewsByCandidate, skipRound, unskipRound, type Interview } from '../../api/interviewsApi'
import { useScheduleInterview } from '../../hooks/useScheduleInterview'
import { RescheduleInterviewModal } from '../../../../../shared/components/modals/RescheduleInterviewModal'
import { nowDatetimeLocal } from '../../../../../shared/components/modals/interviewModalConstants'
import type { JobRound } from '../../../../../shared/types'

const MODES = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
] as const

type RoundState = 'completed' | 'scheduled' | 'skipped' | 'active' | 'idle'

const ROUND_STYLES: Record<RoundState, { background: string; border: string; color: string }> = {
  completed: { background: 'rgba(99,102,241,0.09)', border: '1px solid rgba(99,102,241,0.28)', color: '#a5b4fc' },
  scheduled: { background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' },
  skipped:   { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.28)' },
  active:    { background: 'rgba(29,43,164,0.28)', border: '1px solid rgba(110,168,254,0.45)', color: '#6ea8fe' },
  idle:      { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' },
}

interface ScheduleInterviewCardProps {
  readonly candidateId: string
  readonly jobId: string | undefined
  readonly candidateName: string
  readonly resumeBase64?: string | null
  readonly jdBase64?: string | null
  readonly skippedRounds: number[]
}

function ScheduledRoundCard({
  interview,
  interviewerName,
  onReschedule,
}: {
  readonly interview: Interview
  readonly interviewerName: string
  readonly onReschedule?: () => void
}) {
  const isOnline = !!interview.meetingLink
  const when = new Date(interview.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  const place = isOnline ? interview.meetingLink ?? '' : interview.location ?? 'Company Office'
  const roundName = interview.roundName || `Round ${interview.interviewRound}`
  return (
    <div className="rounded-[10px] px-3 py-2.5" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.18)' }}>
      <div className="flex items-center justify-between gap-2 mb-1.75">
        <span className="text-[12px] font-semibold" style={{ color: '#4ade80' }}>{roundName}</span>
        <span className="text-[9px] font-semibold tracking-[0.08em] uppercase px-1.75 py-0.5 rounded-full" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.12)' }}>{interview.status}</span>
      </div>
      <div className="flex flex-col gap-1.25 text-[11px]" style={{ color: '#9ca3af' }}>
        <div className="flex items-center gap-1.75">
          <Users size={11} className="shrink-0" style={{ color: '#6b7280' }} />
          <span className="truncate">{interviewerName}</span>
        </div>
        <div className="flex items-center gap-1.75">
          <Calendar size={11} className="shrink-0" style={{ color: '#6b7280' }} />
          <span className="truncate">{when}</span>
        </div>
        <div className="flex items-center gap-1.75">
          {isOnline
            ? <Link size={11} className="shrink-0" style={{ color: '#6b7280' }} />
            : <MapPin size={11} className="shrink-0" style={{ color: '#6b7280' }} />}
          <span className="truncate" title={place}>{place}</span>
        </div>
        <div className="flex items-center gap-1.75">
          <Clock size={11} className="shrink-0" style={{ color: '#6b7280' }} />
          <span className="truncate">{interview.durationMinutes} min · {isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
      {onReschedule && (
        <button
          type="button"
          onClick={onReschedule}
          className="flex items-center gap-1 text-[10px] font-semibold mt-2 pt-2 w-full"
          style={{
            color: '#6b7280',
            background: 'none',
            border: 'none',
            borderTop: '1px solid rgba(74,222,128,0.1)',
            cursor: 'pointer',
            transition: 'color 120ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#6ea8fe' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6b7280' }}
        >
          <RotateCcw size={10} /> Reschedule
        </button>
      )}
    </div>
  )
}

interface RoundRowProps {
  readonly round: JobRound
  readonly state: RoundState
  readonly onSelect: () => void
  readonly onSkip: () => void
  readonly onUnskip: () => void
  readonly isSkipPending: boolean
}

function RoundRow({ round, state, onSelect, onSkip, onUnskip, isSkipPending }: RoundRowProps) {
  const s = ROUND_STYLES[state]
  const selectable = state === 'idle' || state === 'active'
  return (
    <div
      className="flex items-center gap-2 rounded-[9px] px-2.5 py-2"
      style={{ background: s.background, border: s.border, transition: 'background 120ms, border-color 120ms' }}
    >
      <button
        type="button"
        onClick={selectable ? onSelect : undefined}
        disabled={!selectable}
        className="flex-1 min-w-0 flex items-center gap-2 text-left"
        style={{ cursor: selectable ? 'pointer' : 'default', background: 'none', border: 'none', padding: 0 }}
      >
        {(state === 'scheduled' || state === 'completed') && <Lock size={12} className="shrink-0" style={{ color: s.color }} />}
        <span className="text-[12px] font-semibold truncate" style={{ color: s.color, textDecoration: state === 'skipped' ? 'line-through' : 'none' }}>
          {round.name || `Round ${round.order}`}
        </span>
        <span className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{round.type}</span>
      </button>

      {state === 'completed' && (
        <span className="text-[9px] font-semibold tracking-[0.06em] uppercase shrink-0" style={{ color: '#a5b4fc' }}>Completed</span>
      )}
      {state === 'scheduled' && (
        <span className="text-[9px] font-semibold tracking-[0.06em] uppercase shrink-0" style={{ color: '#4ade80' }}>Scheduled</span>
      )}
      {state === 'skipped' && (
        <button
          type="button"
          onClick={onUnskip}
          disabled={isSkipPending}
          className="flex items-center gap-1 text-[10px] font-semibold shrink-0 cursor-pointer disabled:opacity-50"
          style={{ color: '#9ca3af', background: 'none', border: 'none' }}
        >
          <RotateCcw size={11} /> Undo skip
        </button>
      )}
      {(state === 'idle' || state === 'active') && (
        <button
          type="button"
          onClick={onSkip}
          disabled={isSkipPending}
          title="Skip this round for this candidate"
          className="flex items-center gap-1 text-[10px] font-semibold shrink-0 cursor-pointer disabled:opacity-50"
          style={{ color: '#6b7280', background: 'none', border: 'none', transition: 'color 120ms' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6b7280' }}
        >
          <Ban size={11} /> Skip
        </button>
      )}
    </div>
  )
}

export function ScheduleInterviewCard({ candidateId, jobId, candidateName, resumeBase64, jdBase64, skippedRounds }: ScheduleInterviewCardProps) {
  const queryClient = useQueryClient()
  const [rescheduleTarget, setRescheduleTarget] = useState<Interview | null>(null)

  const roundsQuery = useQuery({
    queryKey: ['draft-rounds', jobId],
    queryFn: () => getDraftById(jobId!),
    enabled: !!jobId,
    staleTime: 30_000,
  })
  const rounds = roundsQuery.data?.interviewRounds ?? []

  const interviewsQuery = useQuery({
    queryKey: ['interviews', candidateId, jobId],
    queryFn: () => getInterviewsByCandidate(candidateId, jobId!),
    enabled: !!jobId,
    staleTime: 30_000,
  })
  const interviews = interviewsQuery.data ?? []
  const scheduledInterviewsByRound = new Map<number, Interview>()
  for (const iv of interviews.filter(iv => iv.status === 'Scheduled')) {
    const prev = scheduledInterviewsByRound.get(iv.interviewRound)
    if (!prev || new Date(iv.createdAt) > new Date(prev.createdAt)) {
      scheduledInterviewsByRound.set(iv.interviewRound, iv)
    }
  }
  const scheduledInterviews = [...scheduledInterviewsByRound.values()]
    .sort((a, b) => a.interviewRound - b.interviewRound)
  const completedRounds = new Set(
    interviews
      .filter(iv => iv.status === 'Completed')
      .map(iv => String(iv.interviewRound))
  )
  // A round can't be re-booked once it has a live interview (Scheduled) or one
  // that already happened (Completed). Cancelled/NoShow rounds stay re-bookable.
  const scheduledRounds = new Set(
    interviews
      .filter(iv => iv.status === 'Scheduled')
      .map(iv => String(iv.interviewRound))
  )
  const skippedSet = new Set(skippedRounds)

  const {
    ivRound, setIvRound,
    ivInterviewerId, setIvInterviewerId,
    ivScheduledAt, setIvScheduledAt,
    ivMode, setIvMode,
    ivDuration, setIvDuration,
    ivLocation, setIvLocation,
    ivMeetingLink, setIvMeetingLink,
    ivError, ivSuccess,
    interviewers, isLoadingInterviewers,
    isPending, canSubmit, isPastDate, submit,
  } = useScheduleInterview(candidateId, jobId, rounds, resumeBase64, jdBase64)

  const skipMutation = useMutation({
    mutationFn: ({ round, skip }: { round: number; skip: boolean }) =>
      skip ? skipRound(candidateId, jobId!, round) : unskipRound(candidateId, jobId!, round),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId, jobId] })
      queryClient.invalidateQueries({ queryKey: ['candidate-preview', candidateId, jobId] })
    },
  })

  const handleSkip = (order: number) => {
    if (String(order) === ivRound) setIvRound('')
    skipMutation.mutate({ round: order, skip: true })
  }

  const interviewerNameById = new Map((interviewers ?? []).map(iv => [iv.id, iv.fullName]))

  const roundState = (round: JobRound): RoundState => {
    if (completedRounds.has(String(round.order))) return 'completed'
    if (scheduledRounds.has(String(round.order))) return 'scheduled'
    if (skippedSet.has(round.order)) return 'skipped'
    if (ivRound === String(round.order)) return 'active'
    return 'idle'
  }

  return (
    <>
      <div className="flex items-center gap-1.75 mb-5">
        <Calendar size={14} className="text-[#6ea8fe]" />
        <span className="text-[13px] font-semibold text-white">Schedule Interview</span>
      </div>

      {scheduledInterviews.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#4b5563' }}>Scheduled Rounds</p>
          <div className="flex flex-col gap-1.5">
            {scheduledInterviews.map(iv => (
              <ScheduledRoundCard
                key={iv.interviewId}
                interview={iv}
                interviewerName={interviewerNameById.get(iv.interviewerId) ?? 'Interviewer'}
                onReschedule={() => setRescheduleTarget(iv)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#4b5563' }}>Round</p>
        {rounds.length === 0 ? (
          <p className="text-[12px] leading-normal px-2.5 py-2.5 rounded-[9px]" style={{ color: '#9ca3af', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            No interview rounds configured for this role yet. Set them up via{' '}
            <span className="text-[#6ea8fe] font-semibold">Interview Rounds</span> on the job folder.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {rounds.map(round => (
              <RoundRow
                key={round.order}
                round={round}
                state={roundState(round)}
                onSelect={() => setIvRound(String(round.order))}
                onSkip={() => handleSkip(round.order)}
                onUnskip={() => skipMutation.mutate({ round: round.order, skip: false })}
                isSkipPending={skipMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mb-3">
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#4b5563' }}>Interviewer</p>
        <div className="relative">
          <Users size={13} className="absolute left-2.75 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6b7280' }} />
          <select
            value={ivInterviewerId}
            onChange={e => setIvInterviewerId(e.target.value)}
            className="w-full rounded-[10px] py-2.25 pl-8 pr-3.25 text-[13px] appearance-none outline-none cursor-pointer"
            style={{ background: '#1a1b1e', border: '1px solid #37373f', color: ivInterviewerId ? '#d1d5db' : '#6b7280', transition: 'border-color 120ms' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(110,168,254,0.4)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#37373f' }}
          >
            <option value="" disabled>
              {isLoadingInterviewers ? 'Loading…' : 'Select interviewer…'}
            </option>
            {interviewers?.map(iv => (
              // Uses iv.id (DB primary key) — the interviews table uses a FK, not a username.
              // The assignedTo=username invariant applies only to job-folder assignments.
              <option key={iv.id} value={iv.id} style={{ color: '#d1d5db' }}>{iv.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#4b5563' }}>Date & Time</p>
        <div className="relative">
          <Calendar size={13} className="absolute left-2.75 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6b7280' }} />
          <input
            type="datetime-local"
            value={ivScheduledAt}
            min={nowDatetimeLocal()}
            onChange={e => setIvScheduledAt(e.target.value)}
            className="w-full rounded-[10px] py-2.25 pl-8 pr-3.25 text-[13px] outline-none"
            style={{ background: '#1a1b1e', border: '1px solid #37373f', color: ivScheduledAt ? '#d1d5db' : '#6b7280', colorScheme: 'dark', transition: 'border-color 120ms' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(110,168,254,0.4)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#37373f' }}
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#4b5563' }}>Mode</p>
        <div className="flex gap-1.25">
          {MODES.map(({ value, label }) => {
            const active = ivMode === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => { setIvMode(value); if (value !== 'offline') setIvLocation('') }}
                className="flex-1 py-1.75 rounded-lg text-[10px] font-semibold cursor-pointer"
                style={{
                  background: active ? 'rgba(29,43,164,0.28)' : 'rgba(255,255,255,0.03)',
                  border: active ? '1px solid rgba(110,168,254,0.45)' : '1px solid rgba(255,255,255,0.07)',
                  color: active ? '#6ea8fe' : 'rgba(255,255,255,0.3)',
                  transition: 'background 120ms, border-color 120ms, color 120ms',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' } }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#4b5563' }}>Duration (minutes)</p>
        <input
          type="number"
          min={1}
          value={ivDuration}
          onChange={e => setIvDuration(e.target.value)}
          placeholder="e.g. 60"
          className="w-full rounded-[10px] py-2.25 px-3.25 text-[13px] outline-none"
          style={{ background: '#1a1b1e', border: '1px solid #37373f', color: ivDuration ? '#d1d5db' : '#6b7280', colorScheme: 'dark', transition: 'border-color 120ms' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(110,168,254,0.4)' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#37373f' }}
        />
      </div>

      {ivMode === 'offline' && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#4b5563' }}>Location</p>
          <input
            type="text"
            value={ivLocation}
            onChange={e => setIvLocation(e.target.value)}
            placeholder="e.g. Conference Room B, Floor 3"
            className="w-full rounded-[10px] py-2.25 px-3.25 text-[13px] outline-none"
            style={{ background: '#1a1b1e', border: '1px solid #37373f', color: ivLocation ? '#d1d5db' : '#6b7280', transition: 'border-color 120ms' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(110,168,254,0.4)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#37373f' }}
          />
        </div>
      )}

      {ivMode !== 'offline' && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#4b5563' }}>Meeting Link</p>
          <div className="relative">
            <Link size={13} className="absolute left-2.75 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6b7280' }} />
            <input
              type="url"
              value={ivMeetingLink}
              onChange={e => setIvMeetingLink(e.target.value)}
              placeholder="e.g. https://meet.google.com/abc-defg"
              className="w-full rounded-[10px] py-2.25 pl-8 pr-3.25 text-[13px] outline-none"
              style={{ background: '#1a1b1e', border: '1px solid #37373f', color: ivMeetingLink ? '#d1d5db' : '#6b7280', transition: 'border-color 120ms' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(110,168,254,0.4)' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#37373f' }}
            />
          </div>
        </div>
      )}

      {isPastDate && (
        <p className="text-[11px] px-2.5 py-1.5 rounded-[7px] mb-3" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          Pick a future date and time.
        </p>
      )}
      {ivError && (
        <p className="text-[11px] px-2.5 py-1.5 rounded-[7px] mb-3" style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {ivError}
        </p>
      )}
      {ivSuccess && (
        <p className="text-[11px] px-2.5 py-1.5 rounded-[7px] mb-3" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
          Interview scheduled and mail sent successfully.
        </p>
      )}

      <button
        onClick={submit}
        disabled={!canSubmit}
        className="w-full rounded-[10px] py-2.5 px-3.25 text-[13px] font-semibold cursor-pointer disabled:opacity-40"
        style={{ background: 'rgba(29,43,164,0.2)', border: '1px solid rgba(110,168,254,0.3)', color: '#6ea8fe', transition: 'background 120ms' }}
        onMouseEnter={e => { if (!isPending) e.currentTarget.style.background = 'rgba(29,43,164,0.35)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(29,43,164,0.2)' }}
      >
        {isPending ? 'Scheduling…' : 'Send Invite →'}
      </button>

      {rescheduleTarget && (
        <RescheduleInterviewModal
          interview={rescheduleTarget}
          candidateId={candidateId}
          jobId={jobId!}
          candidateName={candidateName}
          resumeBase64={resumeBase64 ?? null}
          jdBase64={jdBase64 ?? null}
          onSuccess={() => setRescheduleTarget(null)}
          onClose={() => setRescheduleTarget(null)}
        />
      )}
    </>
  )
}
