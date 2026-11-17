import { X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { selectWithNotify } from '../../../features/recruiter/candidates/api/candidatesApi'
import { useToast } from '../../hooks/useToast'

interface Props {
  readonly candidateId: string
  readonly jobId: string
  readonly candidateName: string
  readonly onSuccess: () => void
  readonly onClose: () => void
}

export function CandidateSelectionModal({
  candidateId,
  jobId,
  candidateName,
  onSuccess,
  onClose,
}: Props) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const mutation = useMutation({
    mutationFn: () => selectWithNotify(candidateId, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId, jobId] })
      showToast(`${candidateName} marked as Selected. Congratulatory email sent.`, 'success')
      onSuccess()
    },
    onError: () => {
      showToast('Failed to update candidate. Please try again.', 'error')
    },
  })

  return (
    <dialog
      open
      aria-labelledby="confirm-selection-title"
      className="fixed inset-0 bg-black/70 z-1000 flex items-center justify-center p-6 m-0 max-w-none w-full h-full border-0"
      onCancel={onClose}
    >
      <div
        style={{
          background: '#0f1012',
          border: '1px solid #37373f',
          borderRadius: 12,
          width: '100%',
          maxWidth: 420,
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 id="confirm-selection-title" style={{ fontSize: 16, fontWeight: 600, color: '#f3f4f6', margin: 0 }}>Confirm Selection</h2>
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

        <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.6, margin: '0 0 24px' }}>
          You are about to mark <strong style={{ color: '#e5e7eb' }}>{candidateName}</strong> as{' '}
          <strong style={{ color: '#34d399' }}>Selected</strong>. A congratulatory email will be
          sent to the candidate automatically.
        </p>

        {mutation.error && (
          <p style={{ fontSize: 12, color: '#f87171', margin: '0 0 12px' }}>
            Something went wrong. Please try again.
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            style={{
              background: 'none', border: '1px solid #37373f', borderRadius: 6,
              color: '#9ca3af', fontSize: 13, padding: '8px 16px', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={{
              background: '#059669', border: 'none', borderRadius: 6,
              color: '#fff', fontSize: 13, fontWeight: 600,
              padding: '8px 20px', cursor: mutation.isPending ? 'not-allowed' : 'pointer',
              opacity: mutation.isPending ? 0.7 : 1,
            }}
          >
            {mutation.isPending ? 'Confirming…' : 'Confirm & Notify Candidate'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
