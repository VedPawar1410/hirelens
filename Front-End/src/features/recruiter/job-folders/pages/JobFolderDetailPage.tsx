import { useState } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import {
  getCandidateById, moveToNextStage, moveToPreviousStage, rejectCandidate,
  getCandidateStageCountsByJob,
} from '../../candidates/api/candidatesApi'
import { getInterviewsByCandidate } from '../../candidates/api/interviewsApi'
import { getDraftById } from '../../jd-creation/api/jdApi'
import type { CandidateList } from '../../candidates/api/candidatesApi'
import { STAGE_ORDER } from '../../candidates/utils/candidateStatus'
import { getJobFolder } from '../api/jobsApi'
import { jobsQueryKeys } from '../api/jobsQueryKeys'
import { getResumes } from '../../jd-creation/api/resumeApi'
import { UploadResumeModal } from '../components/UploadResumeModal'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'
import { JobFolderHeader } from '../components/jobfolderdetailpage/JobFolderHeader'
import { StageRail } from '../components/jobfolderdetailpage/StageRail'
import { CandidateListPane } from '../components/jobfolderdetailpage/CandidateListPane'
import { CandidateDetailPanel } from '../components/jobfolderdetailpage/CandidateDetailPanel'
import { ResumePanel } from '../components/jobfolderdetailpage/ResumePanel'
import { candidateQueryKeys } from '../../candidates/utils/candidateQueryKeys'
import { useAtsScoreStream } from '../hooks/useAtsScoreStream'
import { InterviewScheduleModal } from '../../../../shared/components/modals/InterviewScheduleModal'
import { CandidateSelectionModal } from '../../../../shared/components/modals/CandidateSelectionModal'
import { ConfigureRoundsModal } from '../../../../shared/components/modals/ConfigureRoundsModal'
import { getNextStageType } from '../../../../shared/utils/stageUtils'
import type { ResumeFilter, FailedFile } from '../components/jobfolderdetailpage/ResumePanel'
import type { Candidate, CandidateStatus } from '../../../../shared/types/index'

function removeFromStagePages(
  candidateId: string,
  old: InfiniteData<CandidateList> | undefined,
): InfiniteData<CandidateList> | undefined {
  if (!old) return old
  return {
    ...old,
    pages: old.pages.map((p, i) => ({
      ...p,
      candidates: p.candidates.filter(c => c.id !== candidateId),
      total: i === 0 ? Math.max(0, p.total - 1) : p.total,
    })),
  }
}

export default function JobFolderDetailPage() {
  const navigate = useNavigate()
  const { jobId } = useParams({ from: '/recruitment/jobs/$jobId' })
  const { stage: initialStage } = useSearch({ from: '/recruitment/jobs/$jobId' })
  const queryClient = useQueryClient()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [resumePanel, setResumePanel] = useState<ResumeFilter | null>(null)
  const [failedFiles, setFailedFiles] = useState<FailedFile[]>(() => {
    try {
      const stored = localStorage.getItem(`failedResumes_${jobId}`)
      const parsed: unknown = JSON.parse(stored ?? 'null')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [selectedStage, setSelectedStage] = useState<CandidateStatus>((initialStage as CandidateStatus) ?? 'under_review')
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [selectionModalOpen, setSelectionModalOpen] = useState(false)
  const [roundsModalOpen, setRoundsModalOpen] = useState(false)

  const { isMobile, isTablet } = useBreakpoints()

  const folderQuery = useQuery({
    queryKey: jobsQueryKeys.detail(jobId),
    queryFn: () => getJobFolder(jobId),
    staleTime: 60_000,
  })

  const stageCountsQuery = useQuery({
    queryKey: candidateQueryKeys.stageCounts(jobId),
    queryFn: () => getCandidateStageCountsByJob(jobId),
    staleTime: 30_000,
  })

  const resumesQuery = useQuery({
    queryKey: ['resumes', jobId],
    queryFn: () => getResumes(jobId),
    staleTime: 30_000,
  })

  const candidateDetailQuery = useQuery({
    queryKey: ['candidate-preview', selectedCandidateId, jobId],
    queryFn: () => getCandidateById(selectedCandidateId ?? '', jobId),
    enabled: !!selectedCandidateId,
    staleTime: 60_000,
  })

  const isSelectedInterviewing = selectedCandidate?.status === 'interviewing'

  // Use same query keys as ScheduleInterviewCard so data is shared from cache.
  const roundsQuery = useQuery({
    queryKey: ['draft-rounds', jobId],
    queryFn: () => getDraftById(jobId),
    enabled: isSelectedInterviewing,
    staleTime: 30_000,
  })

  const interviewsForSelectionQuery = useQuery({
    queryKey: ['interviews', selectedCandidateId, jobId],
    queryFn: () => getInterviewsByCandidate(selectedCandidateId ?? '', jobId),
    enabled: isSelectedInterviewing && !!selectedCandidateId,
    staleTime: 30_000,
  })

  const canMoveToSelected = (() => {
    if (!isSelectedInterviewing) return true
    const configuredRounds = roundsQuery.data?.interviewRounds ?? []
    if (configuredRounds.length === 0) return true
    const interviews = interviewsForSelectionQuery.data ?? []
    const completedSet = new Set(interviews.filter(iv => iv.status === 'Completed').map(iv => iv.interviewRound))
    const skippedSet = new Set(candidateDetailQuery.data?.skippedRounds ?? [])
    return configuredRounds.every(r => completedSet.has(r.order) || skippedSet.has(r.order))
  })()

  const prefetchCandidateDetail = (candidateId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['candidate-preview', candidateId, jobId],
      queryFn: () => getCandidateById(candidateId, jobId),
      staleTime: 60_000,
    })
  }

  const invalidateAfterStageChange = () => {
    // Use the 'stage' prefix — matches ['candidates', jobId, 'stage', ...] lists only,
    // NOT ['candidates', jobId, 'stage-counts'] which is kept accurate by the optimistic update.
    queryClient.invalidateQueries({ queryKey: ['candidates', jobId, 'stage'] })
    queryClient.invalidateQueries({ queryKey: jobsQueryKeys.all() })
  }

  type MutateVars = { id: string; oldStatus?: CandidateStatus }
  type MutateCtx = { prevCounts: Record<string, number> | undefined }

  const applyOptimistic = async (
    candidateId: string,
    oldStatus: CandidateStatus,
    newStatus: CandidateStatus,
  ): Promise<MutateCtx> => {
    await queryClient.cancelQueries({ queryKey: candidateQueryKeys.byJob(jobId) })

    const prevCounts = queryClient.getQueryData<Record<string, number>>(
      candidateQueryKeys.stageCounts(jobId)
    )

    // Remove from old stage list immediately (matches all search variants)
    queryClient.setQueriesData<InfiniteData<CandidateList>>(
      { queryKey: ['candidates', jobId, 'stage', oldStatus] },
      old => removeFromStagePages(candidateId, old)
    )

    // Update counts immediately
    queryClient.setQueryData<Record<string, number>>(
      candidateQueryKeys.stageCounts(jobId),
      old => old ? {
        ...old,
        [oldStatus]: Math.max(0, (old[oldStatus] ?? 0) - 1),
        [newStatus]: (old[newStatus] ?? 0) + 1,
      } : old
    )

    setSelectedCandidate(null)
    return { prevCounts }
  }

  const rollback = (ctx: MutateCtx | undefined) => {
    if (ctx?.prevCounts !== undefined) {
      queryClient.setQueryData(candidateQueryKeys.stageCounts(jobId), ctx.prevCounts)
    }
    queryClient.invalidateQueries({ queryKey: candidateQueryKeys.byJob(jobId) })
  }

  const nextStageMutation = useMutation({
    mutationFn: ({ id }: MutateVars) => moveToNextStage(id, jobId),
    onMutate: ({ id, oldStatus }: MutateVars) => {
      if (!oldStatus) return
      const idx = STAGE_ORDER.indexOf(oldStatus)
      const newStatus = STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)]
      return applyOptimistic(id, oldStatus, newStatus)
    },
    onError: (_err, _vars, ctx) => rollback(ctx),
    onSuccess: invalidateAfterStageChange,
  })
  const prevStageMutation = useMutation({
    mutationFn: ({ id }: MutateVars) => moveToPreviousStage(id, jobId),
    onMutate: ({ id, oldStatus }: MutateVars) => {
      if (!oldStatus) return
      const idx = STAGE_ORDER.indexOf(oldStatus)
      const newStatus = STAGE_ORDER[Math.max(idx - 1, 0)]
      return applyOptimistic(id, oldStatus, newStatus)
    },
    onError: (_err, _vars, ctx) => rollback(ctx),
    onSuccess: invalidateAfterStageChange,
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id }: MutateVars) => rejectCandidate(id, jobId),
    onMutate: ({ id, oldStatus }: MutateVars) => {
      if (!oldStatus) return
      return applyOptimistic(id, oldStatus, 'rejected')
    },
    onError: (_err, _vars, ctx) => rollback(ctx),
    onSuccess: invalidateAfterStageChange,
  })

  useAtsScoreStream(jobId)

  const folder = folderQuery.data
  const resumes = resumesQuery.data ?? []
  const stageCounts = stageCountsQuery.data ?? {}
  const processedCount = resumes.filter(r => r.status === 'processed').length
  const unprocessedCount = resumes.filter(r => r.status === 'unprocessed').length

  const handleStageSelect = (stage: CandidateStatus) => {
    setSelectedStage(stage)
    setSelectedCandidateId(null)
    setSelectedCandidate(null)
  }

  const handlePanelToggle = (filter: ResumeFilter) => setResumePanel(resumePanel === filter ? null : filter)

  const handleCandidateClick = (candidate: Candidate, prevId?: string, nextId?: string) => {
    prefetchCandidateDetail(candidate.id)

    if (isMobile) {
      navigate({
        to: '/recruitment/candidates/$candidateId',
        params: { candidateId: candidate.id },
        search: { jobId, fromJobFolder: true, stage: selectedStage, prevId, nextId },
      })
    } else {
      setSelectedCandidateId(candidate.id)
      setSelectedCandidate(candidate)
    }
  }

  const handleViewProfile = () => {
    if (!selectedCandidate) return

    prefetchCandidateDetail(selectedCandidate.id)
    navigate({
      to: '/recruitment/candidates/$candidateId',
      params: { candidateId: selectedCandidate.id },
      search: { jobId, fromJobFolder: true, stage: selectedStage, prevId: undefined, nextId: undefined },
    })
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100%' }}>
      <JobFolderHeader
        folder={folder}
        isLoading={folderQuery.isLoading}
        isMobile={isMobile}
        resumePanel={resumePanel}
        processedCount={processedCount}
        unprocessedCount={unprocessedCount}
        failedCount={failedFiles.length}
        resumesLoading={resumesQuery.isLoading}
        onPanelToggle={handlePanelToggle}
        onUploadOpen={() => setUploadOpen(true)}
        onConfigureRounds={() => setRoundsModalOpen(true)}
        onBack={() => navigate({ to: '/recruitment/jobs' })}
      />

      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <StageRail
            selectedStage={selectedStage}
            onSelectStage={handleStageSelect}
            stageCounts={stageCounts}
            isLoading={stageCountsQuery.isLoading}
          />
        )}

        <CandidateListPane
          jobId={jobId}
          selectedStage={selectedStage}
          onSelectStage={handleStageSelect}
          selectedCandidateId={selectedCandidateId}
          isMobile={isMobile}
          onCandidateClick={handleCandidateClick}
        />

        {!isMobile && (
          selectedCandidate ? (
            <CandidateDetailPanel
              candidate={selectedCandidate}
              resumeBase64={candidateDetailQuery.data?.resumeBase64 ?? null}
              resumeFileName={candidateDetailQuery.data?.resumeFileName ?? null}
              isResumeLoading={candidateDetailQuery.isFetching}
              canAdvance={canMoveToSelected}
              onNextStage={id => {
                const stageType = getNextStageType(selectedCandidate.status)
                if (stageType === 'interviewing') { setScheduleModalOpen(true); return }
                if (stageType === 'selected') { setSelectionModalOpen(true); return }
                nextStageMutation.mutate({ id, oldStatus: selectedCandidate.status })
              }}
              onPrevStage={id => prevStageMutation.mutate({ id, oldStatus: selectedCandidate.status })}
              onReject={id => rejectMutation.mutate({ id, oldStatus: selectedCandidate.status })}
              onViewProfile={handleViewProfile}
              isMoving={nextStageMutation.isPending && nextStageMutation.variables?.id === selectedCandidate.id}
              isMovingBack={prevStageMutation.isPending && prevStageMutation.variables?.id === selectedCandidate.id}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #37373f', background: '#0f1012' }}>
              <p style={{ fontSize: 13, color: '#4b5563', textAlign: 'center' }}>Select a candidate to view details</p>
            </div>
          )
        )}
      </div>

      {isMobile && !resumePanel && (
        <button
          type="button"
          className="fixed bottom-0 left-0 right-0 h-12 bg-[#161719] border-t border-[#37373f] border-x-0 border-b-0 flex items-center justify-center z-30 cursor-pointer"
          onClick={() => setResumePanel('unprocessed')}
        >
          <span className="text-[13px] font-semibold text-[#f59e0b]">
            {resumesQuery.isLoading ? 'Resumes…' : `Resumes (${unprocessedCount} unprocessed)`}
          </span>
        </button>
      )}

      {resumePanel && (
        <ResumePanel
          filter={resumePanel}
          resumes={resumes}
          failedFiles={failedFiles}
          isLoading={resumesQuery.isLoading}
          onClose={() => setResumePanel(null)}
          isMobile={isMobile}
          panelWidth={isTablet ? 300 : 420}
          onClearFailedFile={index => setFailedFiles(prev => {
            const updated = prev.filter((_, i) => i !== index)
            if (updated.length === 0) localStorage.removeItem(`failedResumes_${jobId}`)
            else localStorage.setItem(`failedResumes_${jobId}`, JSON.stringify(updated))
            return updated
          })}
          onClearAllFailed={() => { localStorage.removeItem(`failedResumes_${jobId}`); setFailedFiles([]) }}
        />
      )}

      {uploadOpen && (
        <UploadResumeModal
          onClose={() => setUploadOpen(false)}
          isMobile={isMobile}
          preselectedJobId={folder?.id ?? jobId}
          preselectedJobTitle={folder?.jobTitle}
          onUploadComplete={(failed) => {
            if (failed.length > 0) setFailedFiles(prev => {
              const updated = [...prev, ...failed]
              localStorage.setItem(`failedResumes_${jobId}`, JSON.stringify(updated))
              return updated
            })
          }}
        />
      )}

      {scheduleModalOpen && selectedCandidate && (
        <InterviewScheduleModal
          candidateId={selectedCandidate.id}
          jobId={jobId}
          candidateName={selectedCandidate.name}
          resumeBase64={candidateDetailQuery.data?.resumeBase64 ?? null}
          jdBase64={candidateDetailQuery.data?.jobDescBase64 ?? null}
          onSuccess={() => { setScheduleModalOpen(false); invalidateAfterStageChange() }}
          onClose={() => setScheduleModalOpen(false)}
        />
      )}

      {selectionModalOpen && selectedCandidate && (
        <CandidateSelectionModal
          candidateId={selectedCandidate.id}
          jobId={jobId}
          candidateName={selectedCandidate.name}
          onSuccess={() => { setSelectionModalOpen(false); invalidateAfterStageChange() }}
          onClose={() => setSelectionModalOpen(false)}
        />
      )}

      {roundsModalOpen && (
        <ConfigureRoundsModal jobId={jobId} onClose={() => setRoundsModalOpen(false)} />
      )}
    </div>
  )
}
