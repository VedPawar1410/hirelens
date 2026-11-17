import { useState } from 'react'
import { X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getInterviewers, INTERVIEWERS_QUERY_KEY } from '../../api/authApi'
import { getInterviewsByCandidate, scheduleRound } from '../../../features/recruiter/candidates/api/interviewsApi'
import { getDraftById } from '../../../features/recruiter/jd-creation/api/jdApi'
import { useToast } from '../../hooks/useToast'
import { toSafeHttpUrl } from '../../lib/urlUtils'
import { INTERVIEW_MODES, inputStyle, labelStyle, nowDatetimeLocal } from './interviewModalConstants'
import { InterviewerSelectField, ModalActionFooter } from './interviewModalShared'

interface Props {
  readonly candidateId: string
  readonly jobId: string
  readonly candidateName: string
  readonly resumeBase64: string | null
  readonly jdBase64: string | null
  readonly onSuccess: () => void
  readonly onClose: () => void
}

export function InterviewScheduleModal({
  candidateId,
  jobId,
  candidateName,
  resumeBase64,
  jdBase64,
  onSuccess,
  onClose,
}: Props) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [scheduledAt, setScheduledAt] = useState('')
  const [interviewerId, setInterviewerId] = useState('')
  const [roundOrder, setRoundOrder] = useState<string | null>(null)
  const [interviewMode, setInterviewMode] = useState<'online' | 'offline' | 'hybrid'>('online')
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [meetingLink, setMeetingLink] = useState('')
  const [location, setLocation] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const interviewersQuery = useQuery({
    queryKey: INTERVIEWERS_QUERY_KEY,
    queryFn: getInterviewers,
    staleTime: 5 * 60_000,
  })

  const roundsQuery = useQuery({
    queryKey: ['draft-rounds', jobId],
    queryFn: () => getDraftById(jobId),
    staleTime: 30_000,
  })

  const interviewsQuery = useQuery({
    queryKey: ['interviews', candidateId, jobId],
    queryFn: () => getInterviewsByCandidate(candidateId, jobId),
    staleTime: 30_000,
  })

  const rounds = roundsQuery.data?.interviewRounds ?? []
  const bookedRounds = new Set(
    (interviewsQuery.data ?? [])
      .filter(iv => iv.status === 'Scheduled' || iv.status === 'Completed')
      .map(iv => iv.interviewRound)
  )
  const availableRounds = rounds.filter(r => !bookedRounds.has(r.order))
  const effectiveRoundOrder = roundOrder ?? (availableRounds.length > 0 ? String(availableRounds[0].order) : '')
  const selectedRound = rounds.find(r => String(r.order) === effectiveRoundOrder)

  const mutation = useMutation({
    mutationFn: scheduleRound,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId, jobId] })
      queryClient.invalidateQueries({ queryKey: ['interviews', candidateId] })
      showToast(`${selectedRound?.name ?? 'Round'} scheduled. Emails sent to both parties.`, 'success')
      onSuccess()
    },
    onError: () => {
      showToast('Failed to schedule interview. Please try again.', 'error')
    },
  })

  const handleSubmit = () => {
    if (!scheduledAt) { setValidationError('Scheduled date & time is required.'); return }
    if (new Date(scheduledAt) <= new Date()) { setValidationError('Pick a future date and time.'); return }
    if (!interviewerId) { setValidationError('Please select an interviewer.'); return }
    if (!selectedRound) { setValidationError('Please select a round.'); return }
    // The url input never fires native validation (submit is a button onClick),
    // and this value is rendered as a clickable href in the interviewer portal
    const safeMeetingLink = toSafeHttpUrl(meetingLink)
    if (meetingLink.trim() && !safeMeetingLink) { setValidationError('Meeting link must be a valid http(s) URL.'); return }
    setValidationError(null)

    mutation.mutate({
      candidateId,
      jobId,
      interviewerId,
      scheduledAt: new Date(scheduledAt).toISOString(),
      interviewRound: selectedRound.order,
      roundName: selectedRound.name,
      interviewType: selectedRound.type || 'Interview',
      interviewMode,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      meetingLink: safeMeetingLink ?? undefined,
      location: location.trim() || undefined,
      resumeBase64: resumeBase64 ?? null,
      jdBase64: jdBase64 ?? null,
    })
  }

  return (
    <dialog
      open
      aria-labelledby="interview-schedule-title"
      className="fixed inset-0 bg-black/70 z-1000 flex items-center justify-center p-6 m-0 max-w-none w-full h-full border-0"
      onCancel={onClose}
    >
      <div
        style={{
          background: '#0f1012',
          border: '1px solid #37373f',
          borderRadius: 12,
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{selectedRound?.name ?? 'Interview'}</p>
            <h2 id="interview-schedule-title" style={{ fontSize: 16, fontWeight: 600, color: '#f3f4f6', margin: 0 }}>
              Schedule Interview, {candidateName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e5e7eb')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label htmlFor="iv-datetime" style={labelStyle}>Date & Time *</label>
            <input
              id="iv-datetime"
              type="datetime-local"
              value={scheduledAt}
              min={nowDatetimeLocal()}
              onChange={e => setScheduledAt(e.target.value)}
              style={inputStyle}
            />
          </div>

          <InterviewerSelectField
            id="iv-interviewer"
            value={interviewerId}
            onChange={setInterviewerId}
            isLoading={interviewersQuery.isLoading}
            interviewers={interviewersQuery.data}
          />

          <div>
            <label htmlFor="iv-round" style={labelStyle}>Round *</label>
            <select
              id="iv-round"
              value={effectiveRoundOrder}
              onChange={e => setRoundOrder(e.target.value)}
              style={inputStyle}
              disabled={roundsQuery.isLoading || rounds.length === 0}
            >
              {rounds.length === 0 && <option value="">No rounds configured for this role</option>}
              {rounds.map(r => (
                <option key={r.order} value={String(r.order)} disabled={bookedRounds.has(r.order)}>
                  {r.name || `Round ${r.order}`} ({r.type}){bookedRounds.has(r.order) ? ' · scheduled' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="iv-mode" style={labelStyle}>Interview Mode</label>
            <select
              id="iv-mode"
              value={interviewMode}
              onChange={e => setInterviewMode(e.target.value as 'online' | 'offline' | 'hybrid')}
              style={inputStyle}
            >
              {INTERVIEW_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label htmlFor="iv-duration" style={labelStyle}>Duration (min)</label>
              <input
                id="iv-duration"
                type="number"
                min={15}
                step={15}
                value={durationMinutes}
                onChange={e => setDurationMinutes(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="iv-location" style={labelStyle}>Location</label>
              <input
                id="iv-location"
                type="text"
                placeholder="e.g. Microsoft Teams"
                value={location}
                onChange={e => setLocation(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label htmlFor="iv-meeting-link" style={labelStyle}>Meeting Link</label>
            <input
              id="iv-meeting-link"
              type="url"
              placeholder="https://meet.google.com/…"
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              style={inputStyle}
            />
          </div>

          {(validationError ?? mutation.error) && (
            <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>
              {validationError ?? 'Something went wrong. Please try again.'}
            </p>
          )}

          <ModalActionFooter
            onClose={onClose}
            isPending={mutation.isPending}
            onSubmit={handleSubmit}
            submitLabel="Schedule & Notify"
            pendingLabel="Scheduling…"
          />
        </div>
      </div>
    </dialog>
  )
}
