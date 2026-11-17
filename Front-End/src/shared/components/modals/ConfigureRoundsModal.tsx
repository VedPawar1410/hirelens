import { useState } from 'react'
import { X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDraftById, updateInterviewRounds } from '../../../features/recruiter/jd-creation/api/jdApi'
import { InterviewRoundsEditor } from '../ui/InterviewRoundsEditor'
import { useToast } from '../../hooks/useToast'
import type { JobRound } from '../../types'

interface Props {
  readonly jobId: string
  readonly onClose: () => void
}

export function ConfigureRoundsModal({ jobId, onClose }: Props) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [rounds, setRounds] = useState<JobRound[] | null>(null)

  const draftQuery = useQuery({
    queryKey: ['draft-rounds', jobId],
    queryFn: () => getDraftById(jobId),
    staleTime: 30_000,
  })

  const effectiveRounds = rounds ?? draftQuery.data?.interviewRounds ?? []

  const mutation = useMutation({
    mutationFn: () => updateInterviewRounds(jobId, effectiveRounds.filter(r => r.name.trim() !== '')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-rounds', jobId] })
      showToast('Interview rounds saved.', 'success')
      onClose()
    },
    onError: () => showToast('Failed to save interview rounds. Please try again.', 'error'),
  })

  return (
    <dialog
      open
      aria-labelledby="configure-rounds-title"
      className="fixed inset-0 bg-black/70 z-1000 flex items-center justify-center p-6 m-0 max-w-none w-full h-full border-0"
      onCancel={onClose}
    >
      <div style={{ background: '#0f1012', border: '1px solid #37373f', borderRadius: 12, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 id="configure-rounds-title" style={{ fontSize: 16, fontWeight: 600, color: '#f3f4f6', margin: 0 }}>
            Interview Process
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e5e7eb')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 18px' }}>
          Define the ordered rounds candidates go through for this role. These drive the round picker when scheduling interviews.
        </p>

        {draftQuery.isLoading ? (
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading…</p>
        ) : (
          <InterviewRoundsEditor value={effectiveRounds} onChange={setRounds} />
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            style={{ background: 'none', border: '1px solid #37373f', borderRadius: 8, color: '#9ca3af', fontSize: 13, padding: '8px 16px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || draftQuery.isLoading}
            style={{ background: '#1d2ba4', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 20px', cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.7 : 1 }}
          >
            {mutation.isPending ? 'Saving…' : 'Save Rounds'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
