import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, FileText } from 'lucide-react'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'
import { getCandidateById } from '../../../recruiter/candidates/api/candidatesApi'
import { getDraftById } from '../../../recruiter/jd-creation/api/jdApi'
import { STAGE_ORDER } from '../../../recruiter/candidates/utils/candidateStatus'
import { usePdfBlobUrl } from '../../../../shared/hooks/usePdfBlobUrl'
import { BezelCard } from '../../../../shared/components/ui/BezelCard'
import { FeedbackSection } from '../components/candidatedetailpage/FeedbackSection'
import { CandidateHeader } from '../components/candidatedetailpage/CandidateHeader'
import { InterviewDetailsCard } from '../components/candidatedetailpage/InterviewDetailsCard'
import { ResumeCard } from '../components/candidatedetailpage/ResumeCard'
import { JobDescCard } from '../components/candidatedetailpage/JobDescCard'
import { PipelineCard } from '../components/candidatedetailpage/PipelineCard'
import { NoteComposer } from '../../../../shared/components/ui/NoteComposer'
import { isLive } from '../utils/dateUtils'
import type { InterviewWithDetails } from '../../../recruiter/candidates/api/interviewsApi'
import type { CandidateDetail } from '../../../../shared/types/index'

export function CandidateDetailPage({
  interview,
  onBack,
  onFeedbackSuccess,
}: Readonly<{
  interview: InterviewWithDetails
  onBack: () => void
  onFeedbackSuccess: () => void
}>) {
  const { isMobile } = useBreakpoints()

  const candidateQuery = useQuery({
    // Intentionally shares cache key with recruiter portal — same endpoint, same data shape.
    queryKey: ['candidate', interview.candidateId, interview.jobId],
    queryFn: () => getCandidateById(interview.candidateId, interview.jobId),
    staleTime: 60_000,
  })

  const candidate: CandidateDetail | null = candidateQuery.data ?? null
  const resumeBlobUrl = usePdfBlobUrl(candidate?.resumeBase64 ?? null)
  const jdBlobUrl = usePdfBlobUrl(candidate?.jobDescBase64 ?? null)

  const jdQuery = useQuery({
    queryKey: ['draft', candidate?.appliedJob?.id],
    queryFn: () => getDraftById(candidate!.appliedJob!.id),
    enabled: !!candidate?.appliedJob?.id,
    staleTime: 5 * 60_000,
  })

  const live = isLive(interview.scheduledAt, interview.durationMinutes)
  const currentStatus = candidate?.status ?? 'under_review'
  const activeStageIdx = STAGE_ORDER.indexOf(currentStatus)

  const matchScore = candidate?.matchScore ?? interview.candidateMatchScore

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] mb-5 cursor-pointer bg-transparent border-none p-0"
        style={{ color: '#9ca3af', transition: 'color 150ms' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#ffffff' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af' }}
      >
        <ArrowLeft size={14} />
        Back to Interviews
      </button>

      <CandidateHeader interview={interview} candidate={candidate} matchScore={matchScore} isMobile={isMobile} />

      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>

        {/* Left — 2/3 width */}
        <div className={`flex flex-col gap-4 ${isMobile ? '' : 'col-span-2'}`}>
          <InterviewDetailsCard interview={interview} live={live} />
          <NoteComposer candidateId={interview.candidateId} />
          <ResumeCard
            candidate={candidate}
            resumeBlobUrl={resumeBlobUrl}
            isLoading={candidateQuery.isLoading}
          />
          <JobDescCard
            candidate={candidate}
            jdQuery={jdQuery}
            jdBlobUrl={jdBlobUrl}
          />
        </div>

        {/* Right — col 1 */}
        <div className="flex flex-col gap-4">
          <PipelineCard activeStageIdx={activeStageIdx} />

          <BezelCard>
            <div className="flex items-center gap-1.75 mb-5">
              <FileText size={14} style={{ color: '#6ea8fe' }} />
              <span className="text-[13px] font-semibold text-white">Interview Feedback</span>
            </div>
            <FeedbackSection interview={interview} onSuccess={onFeedbackSuccess} />
          </BezelCard>
        </div>
      </div>
    </div>
  )
}
