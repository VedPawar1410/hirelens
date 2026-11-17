import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ChevronUp } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  getCandidates,
  getCandidateCounts,
  moveToNextStage,
  shortlistCandidate,
  rejectCandidate,
  getCandidateById,
} from '../api/candidatesApi'
import { getUpcomingInterviews, getInterviewsByCandidate } from '../api/interviewsApi'
import { getDraftById } from '../../jd-creation/api/jdApi'
import { useToast } from '../../../../shared/hooks/useToast'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'
import { CandidateSelectionModal } from '../../../../shared/components/modals/CandidateSelectionModal'
import { InterviewScheduleModal } from '../../../../shared/components/modals/InterviewScheduleModal'
import { getNextStageType } from '../../../../shared/utils/stageUtils'
import { ActionSignalsBar } from '../components/candidatespage/ActionSignalsBar'
import { StatusFilterBar } from '../components/candidatespage/StatusFilterBar'
import { MobileControls } from '../components/candidatespage/MobileControls'
import { CandidateListPanel } from '../components/candidatespage/CandidateListPanel'
import type { Candidate, CandidateStatus } from '../../../../shared/types/index'

type StatusTab = CandidateStatus | ''

const SORT_BY = 'matchScore' as const
const SORT_DIR = 'desc' as const
const UPCOMING_HOURS = 24

export default function CandidatesPage() {
  // Opt out of React Compiler — auto-memoization breaks TanStack Virtualizer's DOM measurement
  "use no memo"
  const queryClient = useQueryClient()
  const { status: initialStatus, filter: initialFilter } = useSearch({ from: '/recruitment/candidates' })
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState<StatusTab>((initialStatus as StatusTab) ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showTopAts, setShowTopAts] = useState(initialFilter === 'topAts')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [selectionTarget, setSelectionTarget] = useState<{ candidateId: string; jobId: string; candidateName: string } | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<{ candidateId: string; jobId: string; candidateName: string; resumeBase64: string | null; jdBase64: string | null } | null>(null)
  const { isMobile, isTablet } = useBreakpoints()
  const { showToast } = useToast()

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 400)
  }, [])

  const candidatesQuery = useInfiniteQuery({
    queryKey: ['candidates', { status: activeStatus, search: debouncedSearch, sortBy: SORT_BY, sortDir: SORT_DIR, showTopAts }],
    queryFn: ({ pageParam }) =>
      getCandidates({
        status: activeStatus,
        search: debouncedSearch,
        page: pageParam,
        limit: 100,
        sortBy: SORT_BY,
        sortDir: SORT_DIR,
        minScore: showTopAts ? 80 : undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.limit
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const countsQuery = useQuery({
    queryKey: ['candidateCounts'],
    queryFn: getCandidateCounts,
    staleTime: 30_000,
  })

  const upcomingQuery = useQuery({
    queryKey: ['upcomingInterviews'],
    queryFn: () => getUpcomingInterviews(UPCOMING_HOURS),
    staleTime: 60_000,
  })

  const candidates: Candidate[] = useMemo(() => {
    const raw = candidatesQuery.data?.pages.flatMap(p => p.candidates) ?? []
    const seen = new Set<string>()
    return raw.filter(c => {
      // Unique per candidate+job pair — same candidate applying to different roles is valid
      const key = `${c.id}::${c.appliedJob?.id ?? ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [candidatesQuery.data])
  const total = candidatesQuery.data?.pages[0]?.total ?? 0

  const headers = useMemo(() => {
    const all = ['CANDIDATE', 'MATCH', 'JOB ROLE', 'SOURCE', 'STATUS', 'APPLIED DATE', 'ACTIONS']
    return isTablet ? all.filter(h => h !== 'SOURCE' && h !== 'APPLIED DATE') : all
  }, [isTablet])

  const colSpan = isTablet ? 5 : 7

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: candidates.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 70,
    overscan: 50,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 70,
  })

  const cardVirtualizer = useVirtualizer({
    count: candidates.length,
    getScrollElement: () => cardContainerRef.current,
    estimateSize: () => 92,
    overscan: 20,
  })

  useEffect(() => {
    rowVirtualizer.scrollToIndex(0, { align: 'start', behavior: 'auto' })
    cardVirtualizer.scrollToIndex(0, { align: 'start', behavior: 'auto' })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once on mount to sync virtualizer state with DOM scroll position
  }, [])

  useEffect(() => {
    rowVirtualizer.scrollToIndex(0, { align: 'start' })
    cardVirtualizer.scrollToIndex(0, { align: 'start' })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TanStack Virtualizer scrollToIndex identity is stable; adding virtualizers would cause an infinite loop
  }, [activeStatus, debouncedSearch, showTopAts])

  useEffect(() => {
    rowVirtualizer.measure()
    cardVirtualizer.measure()
  }, [candidates.length, isMobile, rowVirtualizer, cardVirtualizer])

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = candidatesQuery

  useEffect(() => {
    const containers = [tableContainerRef.current, cardContainerRef.current]
    const handlers = containers.map(container => {
      if (!container) return null
      const check = () => {
        setShowScrollTop(container.scrollTop > 200)
        const { scrollTop, scrollHeight, clientHeight } = container
        if (scrollHeight - scrollTop - clientHeight < 400 && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }
      container.addEventListener('scroll', check, { passive: true })
      return { container, check }
    })
    return () => handlers.forEach(h => h?.container.removeEventListener('scroll', h.check))
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const containers = [tableContainerRef.current, cardContainerRef.current]
    for (const container of containers) {
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container
        if (scrollHeight - scrollTop - clientHeight < 400 && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
          break
        }
      }
    }
  }, [candidates.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['candidates'] })
    queryClient.invalidateQueries({ queryKey: ['candidateCounts'] })
  }, [queryClient])

  const nextStageMutation = useMutation({
    mutationFn: ({ id, jobId }: { id: string; jobId?: string }) => moveToNextStage(id, jobId),
    onSuccess: invalidateAll,
  })
  const shortlistMutation = useMutation({
    mutationFn: ({ id, jobId }: { id: string; jobId?: string }) => shortlistCandidate(id, jobId),
    onSuccess: invalidateAll,
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id, jobId }: { id: string; jobId?: string }) => rejectCandidate(id, jobId),
    onSuccess: invalidateAll,
  })

  const { mutate: nextStage } = nextStageMutation
  const { mutate: shortlist } = shortlistMutation
  const { mutate: reject } = rejectMutation
  const handleNextStage = useCallback(async (id: string, jobId?: string) => {
    const c = candidates.find(c => c.id === id && c.appliedJob?.id === jobId)
    if (!c) return

    const nextStageType = getNextStageType(c.status)

    if (nextStageType === 'interviewing' && jobId) {
      const detail = await queryClient.fetchQuery({ queryKey: ['candidate', id, jobId], queryFn: () => getCandidateById(id, jobId), staleTime: 30_000 })
      setScheduleTarget({ candidateId: id, jobId, candidateName: c.name, resumeBase64: detail.resumeBase64 ?? null, jdBase64: detail.jobDescBase64 ?? null })
      return
    }

    if (c.status === 'interviewing' && jobId) {
      const [detail, jd, interviews] = await Promise.all([
        queryClient.fetchQuery({ queryKey: ['candidate', id, jobId], queryFn: () => getCandidateById(id, jobId), staleTime: 30_000 }),
        queryClient.fetchQuery({ queryKey: ['draft', jobId], queryFn: () => getDraftById(jobId), staleTime: 300_000 }),
        queryClient.fetchQuery({ queryKey: ['interviews', id, jobId], queryFn: () => getInterviewsByCandidate(id, jobId), staleTime: 30_000 }),
      ])
      const configuredRounds = jd?.interviewRounds ?? []
      if (configuredRounds.length > 0) {
        const completedSet = new Set(interviews.filter(iv => iv.status === 'Completed').map(iv => iv.interviewRound))
        const skippedSet = new Set(detail.skippedRounds ?? [])
        if (!configuredRounds.every(r => completedSet.has(r.order) || skippedSet.has(r.order))) {
          showToast('Complete or skip all interview rounds before selecting this candidate.', 'error')
          return
        }
      }
      setSelectionTarget({ candidateId: id, jobId, candidateName: c.name })
      return
    }

    nextStage({ id, jobId })
  }, [nextStage, candidates, queryClient, showToast])
  const handleShortlist = useCallback((id: string, jobId?: string) => shortlist({ id, jobId }), [shortlist])
  const handleReject = useCallback((id: string, jobId?: string) => reject({ id, jobId }), [reject])

  const navigate = useNavigate()
  const handleView = useCallback((candidate: Candidate) => {
    navigate({
      to: '/recruitment/candidates/$candidateId',
      params: { candidateId: candidate.id },
      search: { jobId: candidate.appliedJob?.id, fromJobFolder: undefined, stage: undefined, prevId: undefined, nextId: undefined },
    })
  }, [navigate])

  return (
    <div className={`h-dvh flex flex-col overflow-hidden relative z-1 ${isMobile ? 'px-4 pt-3.5 pb-2.5' : 'px-7 pt-6 pb-5'}`}>
      {scheduleTarget && (
        <InterviewScheduleModal
          candidateId={scheduleTarget.candidateId}
          jobId={scheduleTarget.jobId}
          candidateName={scheduleTarget.candidateName}
          resumeBase64={scheduleTarget.resumeBase64}
          jdBase64={scheduleTarget.jdBase64}
          onSuccess={() => { setScheduleTarget(null); invalidateAll() }}
          onClose={() => setScheduleTarget(null)}
        />
      )}
      {selectionTarget && (
        <CandidateSelectionModal
          candidateId={selectionTarget.candidateId}
          jobId={selectionTarget.jobId}
          candidateName={selectionTarget.candidateName}
          onSuccess={() => { setSelectionTarget(null); invalidateAll() }}
          onClose={() => setSelectionTarget(null)}
        />
      )}
      <div className="shrink-0 mb-5 animate-[fade-up_0.45s_cubic-bezier(0.34,1.56,0.64,1)_both]">
        <div className="inline-flex items-center gap-1.5 mb-2 py-0.75 px-2.5 rounded-full bg-[rgba(29,43,164,0.12)] border border-[rgba(29,43,164,0.25)]">
          <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#6ea8fe]">Talent Pool</span>
        </div>
        <h1 className={`font-bold text-white m-0 tracking-[-0.015em] ${isMobile ? 'text-[22px]' : 'text-[26px]'}`}>
          Candidates Directory
        </h1>
        <p className="text-sm text-[#9ca3af] mt-1.5 tracking-[0.01em]">
          Manage and search your entire talent pool.
        </p>
      </div>

      {!isMobile && (
        <ActionSignalsBar
          countsData={countsQuery.data}
          upcomingData={upcomingQuery.data}
          showTopAts={showTopAts}
          onSetStatus={setActiveStatus}
          onToggleTopAts={() => setShowTopAts(prev => !prev)}
          onViewInterviews={() => {
            const data = upcomingQuery.data
            if (data?.count === 1 && data.nextCandidateId) {
              navigate({
                to: '/recruitment/candidates/$candidateId',
                params: { candidateId: data.nextCandidateId },
                search: { jobId: data.nextJobId ?? undefined, fromJobFolder: undefined, stage: undefined, prevId: undefined, nextId: undefined },
              })
            } else {
              setActiveStatus('')
              setShowTopAts(false)
              handleSearchChange('')
              setDebouncedSearch('')
            }
          }}
        />
      )}

      {!isMobile && (
        <StatusFilterBar
          search={search}
          onSearchChange={handleSearchChange}
          activeStatus={activeStatus}
          onSetStatus={setActiveStatus}
          countsData={countsQuery.data}
        />
      )}

      {isMobile && (
        <MobileControls
          search={search}
          onSearchChange={handleSearchChange}
          activeStatus={activeStatus}
          onSetStatus={setActiveStatus}
          showTopAts={showTopAts}
          onToggleTopAts={() => setShowTopAts(prev => !prev)}
        />
      )}

      <div className="flex-1 min-h-0">
        <CandidateListPanel
          tableContainerRef={tableContainerRef}
          cardContainerRef={cardContainerRef}
          rowVirtualizer={rowVirtualizer}
          cardVirtualizer={cardVirtualizer}
          candidates={candidates}
          isPending={candidatesQuery.isPending}
          isTablet={isTablet}
          isMobile={isMobile}
          colSpan={colSpan}
          headers={headers}
          debouncedSearch={debouncedSearch}
          activeStatus={activeStatus}
          showTopAts={showTopAts}
          onNextStage={handleNextStage}
          onShortlist={handleShortlist}
          onReject={handleReject}
          onView={handleView}
        />
      </div>

      {showScrollTop && (
        <button
          onClick={() => {
            rowVirtualizer.scrollToIndex(0, { align: 'start' })
            cardVirtualizer.scrollToIndex(0, { align: 'start' })
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-9 h-9 rounded-full border border-[rgba(255,255,255,0.1)] bg-[#1a1b1e] shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-opacity duration-200 hover:border-[rgba(255,255,255,0.2)]"
          title="Back to top"
          style={{ cursor: 'pointer' }}
        >
          <ChevronUp size={16} className="text-[#9ca3af]" />
        </button>
      )}

      <div className="shrink-0 mt-2.5 flex items-center justify-between min-h-6">
        <p className="text-xs text-[#6b7280]">
          {candidates.length > 0 && (
            <>
              Showing{' '}
              <span className="text-[#9ca3af]">{candidates.length.toLocaleString()}</span>
              {' '}of{' '}
              <span className="text-[#9ca3af]">{total.toLocaleString()}</span>
              {' '}candidates
            </>
          )}
        </p>
        {candidatesQuery.isFetchingNextPage && (
          <p className="text-xs text-[#6b7280]">Loading more…</p>
        )}
      </div>
    </div>
  )
}
