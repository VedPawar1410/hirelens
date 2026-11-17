import { useState } from 'react'
import { X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getInterviewers, INTERVIEWERS_QUERY_KEY } from '../../api/authApi'
import { rescheduleInterview, type Interview, type RescheduleInterviewDto } from '../../../features/recruiter/candidates/api/interviewsApi'
import { useToast } from '../../hooks/useToast'
import { toSafeHttpUrl } from '../../lib/urlUtils'
import { INTERVIEW_MODES, type InterviewMode, inputStyle, labelStyle, nowDatetimeLocal } from './interviewModalConstants'
import { InterviewerSelectField, ModalActionFooter } from './interviewModalShared'

interface Props {
  readonly interview: Interview
  readonly candidateId: string
  readonly jobId: string
  readonly candidateName: string
  readonly resumeBase64: string | null
  readonly jdBase64: string | null
  readonly onSuccess: () => void
  readonly onClose: () => void
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function RescheduleInterviewModal({
  interview,
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

  const roundName = interview.roundName || `Round ${interview.interviewRound}`
  const initialMode: InterviewMode = interview.meetingLink ? 'online' : 'offline'

  const [scheduledAt, setScheduledAt] = useState(() => isoToDatetimeLocal(interview.scheduledAt))
  const [interviewerId, setInterviewerId] = useState(interview.interviewerId)
  const [interviewMode, setInterviewMode] = useState<InterviewMode>(initialMode)
  const [durationMinutes, setDurationMinutes] = useState(String(interview.durationMinutes))
  const [meetingLink, setMeetingLink] = useState(interview.meetingLink ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)

  const interviewersQuery = useQuery({
    queryKey: INTERVIEWERS_QUERY_KEY,
    queryFn: getInterviewers,
    staleTime: 5 * 60_000,
  })

  const mutation = useMutation({
    mutationFn: (dto: RescheduleInterviewDto) => rescheduleInterview(interview.interviewId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId, jobId] })
      showToast(`${roundName} rescheduled. Emails sent to both parties.`, 'success')
      onSuccess()
    },
    onError: () => {
      showToast('Failed to reschedule interview. Please try again.', 'error')
    },
  })

  const handleSubmit = () => {
    if (!scheduledAt) { setValidationError('Scheduled date & time is required.'); return }
    if (new Date(scheduledAt) <= new Date()) { setValidationError('Pick a future date and time.'); return }
    if (!interviewerId) { setValidationError('Please select an interviewer.'); return }
    // The url input never fires native validation (submit is a button onClick),
    // and this value is rendered as a clickable href in the interviewer portal
    const safeMeetingLink = toSafeHttpUrl(meetingLink)
    if (interviewMode !== 'offline' && meetingLink.trim() && !safeMeetingLink) {
      setValidationError('Meeting link must be a valid http(s) URL.'); return
    }
    setValidationError(null)

    mutation.mutate({
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      interviewerId,
      meetingLink: interviewMode === 'offline' ? undefined : safeMeetingLink ?? undefined,
      resumeBase64: resumeBase64 ?? '',
      jdBase64: jdBase64 ?? '',
    })
  }

  return (
    <dialog
      open
      aria-labelledby="reschedule-iv-title"
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
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{roundName}</p>
            <h2 id="reschedule-iv-title" style={{ fontSize: 16, fontWeight: 600, color: '#f3f4f6', margin: 0 }}>
              Reschedule Interview, {candidateName}
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

        {interview.rescheduleCount > 0 && (
          <div
            style={{
              fontSize: 12,
              color: '#f59e0b',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 16,
            }}
          >
            This interview has been rescheduled {interview.rescheduleCount} time{interview.rescheduleCount > 1 ? 's' : ''}.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label htmlFor="rs-datetime" style={labelStyle}>Date & Time *</label>
            <input
              id="rs-datetime"
              type="datetime-local"
              value={scheduledAt}
              min={nowDatetimeLocal()}
              onChange={e => setScheduledAt(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
          </div>

          <InterviewerSelectField
            id="rs-interviewer"
            value={interviewerId}
            onChange={setInterviewerId}
            isLoading={interviewersQuery.isLoading}
            interviewers={interviewersQuery.data}
          />

          <div>
            <label htmlFor="rs-mode" style={labelStyle}>Interview Mode</label>
            <select
              id="rs-mode"
              value={interviewMode}
              onChange={e => setInterviewMode(e.target.value as InterviewMode)}
              style={inputStyle}
            >
              {INTERVIEW_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rs-duration" style={labelStyle}>Duration (min)</label>
            <input
              id="rs-duration"
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              onChange={e => setDurationMinutes(e.target.value)}
              style={inputStyle}
            />
          </div>

          {interviewMode !== 'offline' && (
            <div>
              <label htmlFor="rs-meeting-link" style={labelStyle}>Meeting Link</label>
              <input
                id="rs-meeting-link"
                type="url"
                placeholder="https://meet.google.com/…"
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          {(validationError ?? mutation.error) && (
            <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>
              {validationError ?? 'Something went wrong. Please try again.'}
            </p>
          )}

          <ModalActionFooter
            onClose={onClose}
            isPending={mutation.isPending}
            onSubmit={handleSubmit}
            submitLabel="Reschedule & Notify"
            pendingLabel="Rescheduling…"
          />
        </div>
      </div>
    </dialog>
  )
}
