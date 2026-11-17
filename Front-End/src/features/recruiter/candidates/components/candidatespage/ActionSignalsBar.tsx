import { AlertCircle, Sparkles, Calendar } from 'lucide-react'
import type { CandidateStatus } from '../../../../../shared/types/index'

interface StageCounts {
  underReview: number
  topMatches: number
}

interface UpcomingData {
  count: number
  nextInterviewAt?: string | null
  nextCandidateName?: string | null
  nextCandidateId?: string | null
  nextJobId?: string | null
}

interface Props {
  readonly countsData: StageCounts | undefined
  readonly upcomingData: UpcomingData | undefined
  readonly showTopAts: boolean
  readonly onSetStatus: (status: CandidateStatus) => void
  readonly onToggleTopAts: () => void
  readonly onViewInterviews: () => void
}

export function ActionSignalsBar({ countsData, upcomingData, showTopAts, onSetStatus, onToggleTopAts, onViewInterviews }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-5 animate-[fade-up_0.45s_cubic-bezier(0.34,1.56,0.64,1)_0.05s_both]">
      <button
        onClick={() => onSetStatus('under_review')}
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] hover:border-[rgba(251,146,60,0.3)] hover:bg-[rgba(251,146,60,0.04)] transition-all duration-150 cursor-pointer text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-[rgba(251,146,60,0.1)] shrink-0">
            <AlertCircle size={15} className="text-[#fb923c]" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white leading-tight truncate">
              {countsData ? `${countsData.underReview} candidates need a decision` : '— candidates need a decision'}
            </p>
            <p className="text-[11px] text-[#6b7280] mt-0.5 truncate">Waiting in Under Review</p>
          </div>
        </div>
        <span className="text-[12px] font-semibold text-[#fb923c] shrink-0 whitespace-nowrap">Review →</span>
      </button>

      <button
        onClick={onToggleTopAts}
        className={[
          'flex items-center justify-between gap-3 px-4 py-3 rounded-[14px] border transition-all duration-150 cursor-pointer text-left',
          showTopAts
            ? 'border-[rgba(251,191,36,0.4)] bg-[rgba(217,119,6,0.08)]'
            : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] hover:border-[rgba(251,191,36,0.3)] hover:bg-[rgba(217,119,6,0.04)]',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-[rgba(217,119,6,0.1)] shrink-0">
            <Sparkles size={15} className="text-[#fbbf24]" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white leading-tight truncate">
              {countsData ? `${countsData.topMatches} AI top matches` : '— AI top matches'}
            </p>
            <p className="text-[11px] text-[#6b7280] mt-0.5 truncate">Score above 80% across all roles</p>
          </div>
        </div>
        <span className="text-[12px] font-semibold text-[#fbbf24] shrink-0 whitespace-nowrap">
          {showTopAts ? 'Clear ×' : 'See picks →'}
        </span>
      </button>

      <button
        onClick={onViewInterviews}
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] hover:border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.04)] transition-all duration-150 cursor-pointer text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-[rgba(99,102,241,0.1)] shrink-0">
            <Calendar size={15} className="text-[#818cf8]" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white leading-tight truncate">
              {upcomingData ? `${upcomingData.count} Interviews in 24h` : '— Interviews in 24h'}
            </p>
            <p className="text-[11px] text-[#6b7280] mt-0.5 truncate">
              {upcomingData?.nextCandidateName && upcomingData?.nextInterviewAt
                ? `Next: ${new Date(upcomingData.nextInterviewAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${upcomingData.nextCandidateName}`
                : 'No interviews scheduled soon'}
            </p>
          </div>
        </div>
        <span className="text-[12px] font-semibold text-[#818cf8] shrink-0 whitespace-nowrap">View all →</span>
      </button>
    </div>
  )
}
