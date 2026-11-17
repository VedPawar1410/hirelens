import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../../../../shared/hooks/useAuth'
import { useToast } from '../../../../shared/hooks/useToast'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'
import { getDrafts, submitRoleDescription, submitDraft } from '../../../recruiter/jd-creation/api/jdApi'
import { interviewerDraftsQueryKey, DRAFTS_ALL_QUERY_KEY } from '../../../recruiter/jd-creation/queryKeys'
import { DraftListView } from '../components/DraftListView'
import { DraftDetailView } from '../components/DraftDetailView'
import { ApiError } from '../../../../shared/types/api'
import type { JDDraft } from '../../../../shared/types'

class PartialSubmitError extends Error {}

export default function JDCreationPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { isMobile, isTablet } = useBreakpoints()

  const queryKey = useMemo(() => interviewerDraftsQueryKey(user?.username), [user?.username])

  // Poll every 5 seconds — recruitment can assign new JDs at any time.
  const { data: allMyDrafts = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getDrafts({ assignedTo: user!.username }),
    enabled: !!user,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  })

  const pendingCount = allMyDrafts.filter((d) => d.status === 'assigned').length
  const submittedCount = allMyDrafts.filter((d) => d.status === 'returned' || d.status === 'finalized').length

  const [now] = useState(() => Date.now())

  function accumulateMaxWaitDays(max: number, d: JDDraft): number {
    const days = Math.floor((now - new Date(d.createdAt).getTime()) / 86_400_000)
    return Math.max(max, days)
  }

  const oldestWaitDays = allMyDrafts
    .filter((d) => d.status === 'assigned')
    .reduce((max, d) => accumulateMaxWaitDays(max, d), 0)

  const [selectedDraft, setSelectedDraft] = useState<JDDraft | null>(null)
  const [roleDescription, setRoleDescription] = useState('')

  const submitMutation = useMutation({
    mutationFn: async ({ id, description }: { id: string; description: string }) => {
      await submitRoleDescription(id, description)
      // Description is saved at this point — submitDraft failure is a partial success
      try {
        await submitDraft(id)
      } catch {
        throw new PartialSubmitError()
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey })
      queryClient.invalidateQueries({ queryKey: DRAFTS_ALL_QUERY_KEY })
      showToast('Role description submitted. The recruitment team has been notified.', 'success')
      setSelectedDraft(null)
      setRoleDescription('')
    },
    onError: (err) => {
      if (err instanceof PartialSubmitError) {
        queryClient.invalidateQueries({ queryKey: queryKey })
        showToast('Description saved, but failed to notify recruitment. Please try submitting again.', 'error')
      } else {
        const msg = err instanceof ApiError ? err.message : 'Failed to submit, please try again.'
        showToast(msg, 'error')
      }
    },
  })

  function handleSelectDraft(draft: JDDraft) {
    setSelectedDraft(draft)
    setRoleDescription(draft.roleDescription ?? '')
  }

  function handleBack() {
    setSelectedDraft(null)
    setRoleDescription('')
  }

  const pageHeader = (
    <div className={`border-b border-[#37373f] shrink-0 ${isMobile ? 'py-3.5 px-4' : 'py-4.5 px-7'}`}>
      <div className="flex items-center justify-between gap-4 mb-1">
        <div className="flex items-center gap-3">
          <span className="bg-[rgba(99,102,241,0.15)] text-[#818cf8] text-[10px] font-semibold tracking-widest uppercase rounded-full py-0.75 px-3 shrink-0">
            Interview Panel
          </span>
          <h1 className="text-[22px] font-bold text-white m-0">JD Creation</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pendingCount > 0 && (
            <span className="bg-[rgba(245,158,11,0.12)] text-[#fbbf24] text-[12px] font-medium rounded-full py-1 px-3">
              {pendingCount} pending
            </span>
          )}
          {submittedCount > 0 && (
            <span className="bg-[rgba(34,197,94,0.1)] text-[#4ade80] text-[12px] font-medium rounded-full py-1 px-3">
              {submittedCount} submitted
            </span>
          )}
        </div>
      </div>

      <p className="text-[13px] text-[#6b7280] m-0 mb-3">
        JDs assigned to you — fill in the role description and send back to recruitment.
      </p>

      {pendingCount > 0 && oldestWaitDays >= 2 && (
        <div className="flex items-start gap-2.5 bg-[rgba(245,158,11,0.07)] border border-[rgba(245,158,11,0.18)] rounded-xl py-2.5 px-3.5">
          <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-semibold text-[#fbbf24] m-0">
              {pendingCount} JD{pendingCount > 1 ? 's' : ''} waiting on your role description
            </p>
            <p className="text-[11px] text-[#6b7280] m-0 mt-0.5">
              Oldest has been waiting {oldestWaitDays} day{oldestWaitDays === 1 ? '' : 's'} — recruiter is blocked.
            </p>
          </div>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <div className="flex flex-col overflow-hidden" style={{ height: '100%' }}>
        {!selectedDraft && pageHeader}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedDraft ? (
            <DraftDetailView
              draft={selectedDraft}
              roleDescription={roleDescription}
              onRoleDescriptionChange={setRoleDescription}
              onBack={handleBack}
              onSubmit={() =>
                submitMutation.mutate({ id: selectedDraft.id, description: roleDescription })
              }
              isSubmitting={submitMutation.isPending}
            />
          ) : (
            <DraftListView
              drafts={allMyDrafts}
              isLoading={isLoading}
              onSelect={handleSelectDraft}
              selectedId={null}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100%' }}>
      {pageHeader}

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left list panel */}
        <div className={`${isTablet ? 'w-60' : 'w-72.5'} shrink-0 border-r border-[#37373f] overflow-y-auto p-4`}>
          <DraftListView
            drafts={allMyDrafts}
            isLoading={isLoading}
            onSelect={handleSelectDraft}
            selectedId={selectedDraft?.id ?? null}
          />
        </div>

        {/* Right editor panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedDraft ? (
            <DraftDetailView
              draft={selectedDraft}
              roleDescription={roleDescription}
              onRoleDescriptionChange={setRoleDescription}
              onBack={handleBack}
              onSubmit={() =>
                submitMutation.mutate({ id: selectedDraft.id, description: roleDescription })
              }
              isSubmitting={submitMutation.isPending}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <p className="text-[14px] font-medium text-[#4b5563] m-0 mb-1">Select a JD to begin</p>
                <p className="text-[12px] text-[#374151] m-0">
                  Click an assigned JD from the left to fill in the role description.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
