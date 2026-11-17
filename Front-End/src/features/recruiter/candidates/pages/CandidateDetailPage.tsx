import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileX } from 'lucide-react'
import { getCandidateById, moveToNextStage, moveToPreviousStage, shortlistCandidate, rejectCandidate } from '../api/candidatesApi'
import { getInterviewsByCandidate } from '../api/interviewsApi'
import { ApiError } from '../../../../shared/types/api'
import { getDraftById } from '../../jd-creation/api/jdApi'
import { STATUS_BADGE, STAGE_ORDER } from '../utils/candidateStatus'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'
import { useToast } from '../../../../shared/hooks/useToast'
import { ScheduleInterviewCard } from '../components/candidatedetailpage/ScheduleInterviewCard'
import { InterviewFeedbackCard } from '../components/candidatedetailpage/InterviewFeedbackCard'
import { CandidateProfileHeader } from '../components/candidatedetailpage/CandidateProfileHeader'
import { ResumeCard } from '../components/candidatedetailpage/ResumeCard'
import { JdCard } from '../components/candidatedetailpage/JdCard'
import { PipelineCard } from '../components/candidatedetailpage/PipelineCard'
import { NoteComposer } from '../../../../shared/components/ui/NoteComposer'
import { BezelCard } from '../../../../shared/components/ui/BezelCard'
import { InterviewScheduleModal } from '../../../../shared/components/modals/InterviewScheduleModal'
import { CandidateSelectionModal } from '../../../../shared/components/modals/CandidateSelectionModal'
import { getNextStageType } from '../../../../shared/utils/stageUtils'
import type { Candidate, CandidateDetail, CandidateStatus } from '../../../../shared/types/index'

function resolveNavIds(
  stageList: Candidate[],
  currentIndex: number,
  searchPrevId: string | undefined,
  searchNextId: string | undefined,
): { prevId: string | null; nextId: string | null } {
  const prevId = currentIndex > 0 ? stageList[currentIndex - 1].id : (searchPrevId ?? null)
  const nextId = currentIndex >= 0 && currentIndex < stageList.length - 1
    ? stageList[currentIndex + 1].id
    : (searchNextId ?? null)
  return { prevId, nextId }
}

function buildErrorMessage(
  jobId: string | undefined,
  isError: boolean,
  error: Error | null,
): string {
  if (!jobId) return 'No job context — navigate from the Candidates list.'
  if (isError) {
    const detail = error instanceof ApiError ? error.message : error?.message ?? 'Unknown error'
    return `Failed to load: ${detail}`
  }
  return 'Candidate not found.'
}

function toDetailPlaceholder(candidate: Candidate): CandidateDetail {
  return {
    ...candidate,
    skippedRounds: [],
    resumeBase64: null,
    jobDescBase64: null,
    resumeFileName: null,
    jobDescFileName: null,
  }
}

export default function CandidateDetailPage() {
  const { candidateId } = useParams({ from: '/recruitment/candidates/$candidateId' })
  const { jobId, fromJobFolder, stage, prevId: searchPrevId, nextId: searchNextId } = useSearch({ from: '/recruitment/candidates/$candidateId' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isMobile } = useBreakpoints()

  const candidateQuery = useQuery({
    queryKey: ['candidate', candidateId, jobId],
    queryFn: () => {
      if (!jobId) throw new Error('No jobId')
      return getCandidateById(candidateId, jobId)
    },
    staleTime: 30_000,
    enabled: !!jobId,
    placeholderData: () => {
      if (jobId) {
        const preview = queryClient.getQueryData<CandidateDetail>(['candidate-preview', candidateId, jobId])
        if (preview) return preview
      }

      // Seed from the candidates list cache so the page renders immediately.
      // resumeBase64/jobDescBase64 won't be present until the detail fetch completes.
      for (const [, data] of queryClient.getQueriesData<{ pages: { candidates: Candidate[] }[] }>({ queryKey: ['candidates'] })) {
        if (!data?.pages) continue
        for (const page of data.pages) {
          const found = page.candidates?.find(c => c.id === candidateId)
          if (found) return toDetailPlaceholder(found)
        }
      }
    },
  })

  const candidate = candidateQuery.data ?? null

  const jdQuery = useQuery({
    queryKey: ['draft', candidate?.appliedJob?.id],
    queryFn: () => {
      const id = candidate?.appliedJob?.id
      if (!id) throw new Error('No job ID')
      return getDraftById(id)
    },
    enabled: !!candidate?.appliedJob?.id,
    staleTime: 5 * 60_000,
  })

  const interviewsQuery = useQuery({
    queryKey: ['interviews', candidateId, jobId],
    queryFn: () => getInterviewsByCandidate(candidateId, jobId!),
    enabled: candidate?.status === 'interviewing' && !!jobId,
    staleTime: 30_000,
  })

  // Read prev/next from cache populated by JobFolderDetailPage — no extra fetch.
  // Falls back to URL search params on first load before cache is warm.
  const cachedFolder = fromJobFolder && jobId
    ? queryClient.getQueryData<{ candidates: Candidate[] }>(['candidates', { jobId }])
    : undefined
  const stageList = useMemo(() => {
    if (!cachedFolder || !candidate) return []
    return cachedFolder.candidates.filter(c => c.status === candidate.status)
  }, [cachedFolder, candidate])
  const currentIndex = stageList.findIndex(c => c.id === candidateId)
  const { prevId, nextId } = resolveNavIds(stageList, currentIndex, searchPrevId, searchNextId)

  const [actionError, setActionError] = useState<string | null>(null)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [selectionModalOpen, setSelectionModalOpen] = useState(false)
  const [showPrevConfirm, setShowPrevConfirm] = useState(false)
  const { showToast } = useToast()

  const currentStatus: CandidateStatus = candidate?.status ?? 'under_review'

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['candidates'] }),
    [queryClient],
  )

  const onSuccess = useCallback((data: { status: CandidateStatus }) => {
    queryClient.setQueryData<Candidate>(
      ['candidate', candidateId, jobId],
      (prev) => prev ? { ...prev, status: data.status } : prev,
    )
    setActionError(null)
    setShowPrevConfirm(false)
    invalidate()
    showToast(`Candidate moved to ${STATUS_BADGE[data.status].label}.`, 'success')
  }, [queryClient, candidateId, jobId, invalidate, showToast])

  const onError = useCallback(() => {
    setActionError('Action failed. Please try again.')
    showToast('Action failed. Please try again.', 'error')
  }, [showToast])

  // candidateId and jobId come from stable route params so capturing via closure is safe here
  const nextMutation = useMutation({ mutationFn: () => moveToNextStage(candidateId, jobId), onSuccess, onError })
  const shortlistMutation = useMutation({ mutationFn: () => shortlistCandidate(candidateId, jobId), onSuccess, onError })
  const rejectMutation = useMutation({ mutationFn: () => rejectCandidate(candidateId, jobId), onSuccess, onError })
  const prevMutation = useMutation({ mutationFn: () => moveToPreviousStage(candidateId, jobId), onSuccess, onError })

  const stageIndex = STAGE_ORDER.indexOf(currentStatus)
  const badge = STATUS_BADGE[currentStatus]
  const canGoBack = stageIndex > 0

  const canMoveToSelected = (() => {
    if (currentStatus !== 'interviewing') return true
    const configuredRounds = jdQuery.data?.interviewRounds ?? []
    if (configuredRounds.length === 0) return true
    const interviews = interviewsQuery.data ?? []
    const completedSet = new Set(interviews.filter(iv => iv.status === 'Completed').map(iv => iv.interviewRound))
    const skippedSet = new Set(candidate?.skippedRounds ?? [])
    return configuredRounds.every(r => completedSet.has(r.order) || skippedSet.has(r.order))
  })()
  const hasPrevActiveRounds = currentStatus === 'interviewing' &&
    (interviewsQuery.data ?? []).some(iv => iv.status === 'Completed' || iv.status === 'Scheduled')

  const isActionPending = nextMutation.isPending || prevMutation.isPending || shortlistMutation.isPending || rejectMutation.isPending

  const handleBack = () => fromJobFolder && jobId
    ? navigate({ to: '/recruitment/jobs/$jobId', params: { jobId }, search: { stage } })
    : navigate({ to: '/recruitment/candidates', search: { status: undefined, filter: undefined } })

  const handlePrevCandidate = (id: string) =>
    navigate({
      to: '/recruitment/candidates/$candidateId',
      params: { candidateId: id },
      search: { jobId, fromJobFolder: true, stage, prevId: stageList[currentIndex - 2]?.id ?? undefined, nextId: candidateId },
    })

  const handleNextCandidate = (id: string) =>
    navigate({
      to: '/recruitment/candidates/$candidateId',
      params: { candidateId: id },
      search: { jobId, fromJobFolder: true, stage, prevId: candidateId, nextId: stageList[currentIndex + 2]?.id ?? undefined },
    })

  if (!candidate && (candidateQuery.isLoading || candidateQuery.isFetching)) {
    return (
      <div className="min-h-dvh relative z-1 flex items-center justify-center">
        <div className="text-[#6b7280] text-sm">Loading candidate…</div>
      </div>
    )
  }

  if (!candidate) {
    const errorMsg = buildErrorMessage(jobId, candidateQuery.isError, candidateQuery.error)
    return (
      <div className="min-h-dvh relative z-1 flex flex-col items-center justify-center gap-4">
        <FileX size={40} className="text-[#6b7280]" />
        <p className="text-[#9ca3af] text-sm text-center max-w-xs">{errorMsg}</p>
        <button
          onClick={handleBack}
          className="text-[#6ea8fe] text-sm underline underline-offset-2 bg-transparent border-none cursor-pointer"
        >
          {fromJobFolder ? 'Back to Job Folder' : 'Back to Candidates'}
        </button>
      </div>
    )
  }

  return (
    <div className={`min-h-dvh relative z-1 overflow-x-hidden ${isMobile ? 'px-4 pt-3.5 pb-8' : 'px-7 pt-6 pb-8'}`}>
      <CandidateProfileHeader
        candidate={candidate}
        isMobile={isMobile}
        fromJobFolder={fromJobFolder}
        prevId={prevId}
        nextId={nextId}
        badge={badge}
        onBack={handleBack}
        onPrevCandidate={handlePrevCandidate}
        onNextCandidate={handleNextCandidate}
      />

      {scheduleModalOpen && jobId && (
        <InterviewScheduleModal
          candidateId={candidateId}
          jobId={jobId}
          candidateName={candidate.name}
          resumeBase64={candidate.resumeBase64 ?? null}
          jdBase64={candidate.jobDescBase64 ?? null}
          onSuccess={() => { setScheduleModalOpen(false); invalidate() }}
          onClose={() => setScheduleModalOpen(false)}
        />
      )}

      {selectionModalOpen && jobId && (
        <CandidateSelectionModal
          candidateId={candidateId}
          jobId={jobId}
          candidateName={candidate.name}
          onSuccess={() => { setSelectionModalOpen(false); invalidate() }}
          onClose={() => setSelectionModalOpen(false)}
        />
      )}

      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        <div className={`flex flex-col gap-4 ${isMobile ? '' : 'col-span-2'}`}>
          <NoteComposer candidateId={candidateId} />
          <ResumeCard
            resumeBase64={candidate.resumeBase64 ?? null}
            resumeFileName={candidate.resumeFileName ?? null}
            isLoading={candidateQuery.isFetching && !candidate.resumeBase64}
          />
          <JdCard
            appliedJob={candidate.appliedJob}
            jobDescBase64={candidate.jobDescBase64 ?? null}
            jobDescFileName={candidate.jobDescFileName ?? null}
            jdData={jdQuery.data}
            jdIsLoading={jdQuery.isLoading}
            documentIsLoading={candidateQuery.isFetching && !candidate.jobDescBase64}
          />
        </div>

        <div className="flex flex-col gap-4">
          <PipelineCard
            currentStatus={currentStatus}
            badge={badge}
            actionError={actionError}
            isActionPending={isActionPending}
            canGoBack={canGoBack}
            isPrevPending={prevMutation.isPending}
            isNextPending={nextMutation.isPending}
            isNextDisabled={!canMoveToSelected}
            showPrevConfirm={showPrevConfirm}
            onPrev={() => {
              if (hasPrevActiveRounds) { setShowPrevConfirm(true); return }
              prevMutation.mutate()
            }}
            onPrevConfirm={() => { setShowPrevConfirm(false); prevMutation.mutate() }}
            onPrevCancel={() => setShowPrevConfirm(false)}
            onNext={() => {
              const stageType = getNextStageType(currentStatus)
              if (stageType === 'interviewing') { setScheduleModalOpen(true); return }
              if (stageType === 'selected') { setSelectionModalOpen(true); return }
              nextMutation.mutate()
            }}
            onReject={() => rejectMutation.mutate()}
          />
          <BezelCard>
            <ScheduleInterviewCard
              candidateId={candidateId}
              jobId={jobId}
              candidateName={candidate.name}
              resumeBase64={candidate.resumeBase64}
              jdBase64={candidate.jobDescBase64}
              skippedRounds={candidate.skippedRounds}
            />
          </BezelCard>
          <BezelCard>
            <InterviewFeedbackCard candidateId={candidateId} jobId={jobId} />
          </BezelCard>
        </div>
      </div>
    </div>
  )
}
