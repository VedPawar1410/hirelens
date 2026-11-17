import type { Interviewer } from '../../api/authApi'
import { inputStyle, labelStyle } from './interviewModalConstants'

interface InterviewerSelectFieldProps {
  readonly id: string
  readonly value: string
  readonly onChange: (id: string) => void
  readonly isLoading: boolean
  readonly interviewers: Interviewer[] | undefined
}

export function InterviewerSelectField({ id, value, onChange, isLoading, interviewers }: InterviewerSelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>Interviewer *</label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
        disabled={isLoading}
      >
        <option value="">{isLoading ? 'Loading…' : 'Select interviewer'}</option>
        {interviewers?.map(iv => (
          <option key={iv.id} value={iv.id}>{iv.fullName} ({iv.username})</option>
        ))}
      </select>
    </div>
  )
}

interface ModalActionFooterProps {
  readonly onClose: () => void
  readonly isPending: boolean
  readonly onSubmit: () => void
  readonly submitLabel: string
  readonly pendingLabel: string
}

export function ModalActionFooter({ onClose, isPending, onSubmit, submitLabel, pendingLabel }: ModalActionFooterProps) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
      <button
        type="button"
        onClick={onClose}
        disabled={isPending}
        style={{
          background: 'none', border: '1px solid #37373f', borderRadius: 6,
          color: '#9ca3af', fontSize: 13, padding: '8px 16px', cursor: 'pointer',
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending}
        style={{
          background: '#2563eb', border: 'none', borderRadius: 6,
          color: '#fff', fontSize: 13, fontWeight: 600,
          padding: '8px 20px', cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? pendingLabel : submitLabel}
      </button>
    </div>
  )
}
