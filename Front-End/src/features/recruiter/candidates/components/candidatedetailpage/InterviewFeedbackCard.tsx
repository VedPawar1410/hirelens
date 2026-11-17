import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getInterviewsByCandidate, type Interview } from '../../api/interviewsApi'
import { SubmittedFeedbackView } from '../../../../../shared/components/ui/SubmittedFeedbackView'

interface InterviewFeedbackCardProps {
  readonly candidateId: string
  readonly jobId: string | undefined
}

const NO_FEEDBACK_STATUSES = new Set(['Cancelled', 'NoShow'])

function hasFeedback(iv: Interview): boolean {
  return iv.overallRating !== null && iv.recommendation !== null
}

function roundLabel(iv: Interview): string {
  return iv.roundName?.trim() ? iv.roundName : `Round ${iv.interviewRound}`
}

function roundStatus(iv: Interview): 'done' | 'awaiting' | 'skipped' {
  if (hasFeedback(iv)) return 'done'
  if (NO_FEEDBACK_STATUSES.has(iv.status)) return 'skipped'
  return 'awaiting'
}

const STATUS_DOT_COLOR: Record<'done' | 'awaiting' | 'skipped', string> = {
  done: '#4ade80',
  awaiting: '#fbbf24',
  skipped: 'rgba(255,255,255,0.12)',
}

function RoundFeedbackPanel({ selected }: { readonly selected: Interview }) {
  if (hasFeedback(selected)) {
    return (
      <SubmittedFeedbackView
        heading={roundLabel(selected)}
        rating={selected.overallRating}
        recommendation={selected.recommendation ?? ''}
        notes={selected.feedbackNotes}
      />
    )
  }
  if (NO_FEEDBACK_STATUSES.has(selected.status)) {
    const outcomeLabel = selected.status === 'NoShow' ? 'a no-show' : 'cancelled'
    return <p className="text-[12px] text-[#6b7280]">This round was {outcomeLabel}.</p>
  }
  return (
    <p className="text-[12px] text-[#6b7280]">
      Awaiting feedback for {roundLabel(selected)}. It appears here once the interviewer submits it.
    </p>
  )
}

export function InterviewFeedbackCard({ candidateId, jobId }: InterviewFeedbackCardProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const hasAutoOpened = useRef(false)

  const interviewsQuery = useQuery({
    queryKey: ['interviews', candidateId, jobId],
    queryFn: () => getInterviewsByCandidate(candidateId, jobId!),
    enabled: !!jobId,
    staleTime: 30_000,
    // Feedback is submitted from the interviewer's separate session, so this
    // client gets no invalidation — poll so it appears without a manual refresh.
    refetchInterval: 15_000,
  })

  const byRound = new Map<number, Interview>()
  for (const iv of interviewsQuery.data ?? []) {
    const prev = byRound.get(iv.interviewRound)
    if (!prev || new Date(iv.createdAt) > new Date(prev.createdAt)) {
      byRound.set(iv.interviewRound, iv)
    }
  }
  const interviews = [...byRound.values()].sort((a, b) => a.interviewRound - b.interviewRound)
  const reviewed = interviews.filter(hasFeedback)

  // Auto-open and select the first reviewed round once feedback arrives.
  useEffect(() => {
    if (!hasAutoOpened.current && reviewed.length > 0) {
      setOpen(true)
      setSelectedId(reviewed[0].interviewId)
      hasAutoOpened.current = true
    }
  }, [reviewed])

  function handleToggle() {
    setOpen(o => {
      if (!o && selectedId === null && interviews.length > 0) {
        setSelectedId((reviewed[0] ?? interviews[0]).interviewId)
      }
      return !o
    })
  }

  const selected = interviews.find(iv => iv.interviewId === selectedId) ?? null

  return (
    <>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between cursor-pointer"
        style={{ background: 'none', border: 'none', padding: 0 }}
      >
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#6b7280]">Interview Feedback</p>
        <div className="flex items-center gap-2">
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: reviewed.length > 0 ? '#4ade80' : 'rgba(255,255,255,0.15)' }} />
          <span style={{ color: '#6b7280', fontSize: 12, display: 'inline-block', transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </div>
      </button>

      {open && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {interviewsQuery.isLoading && (
            <p className="text-[12px] text-[#6b7280]">Loading feedback…</p>
          )}
          {interviewsQuery.isError && (
            <p className="text-[12px] text-[#f87171]">Failed to load feedback.</p>
          )}
          {!interviewsQuery.isLoading && !interviewsQuery.isError && interviews.length === 0 && (
            <p className="text-[12px] text-[#6b7280]">No interviews scheduled yet.</p>
          )}
          {!interviewsQuery.isLoading && !interviewsQuery.isError && interviews.length > 0 && (
            <>
              {/* Round chip tabs — one chip per interview, height stays fixed as rounds grow */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {interviews.map(iv => {
                  const status = roundStatus(iv)
                  const isActive = selectedId === iv.interviewId
                  return (
                    <button
                      key={iv.interviewId}
                      onClick={() => setSelectedId(iv.interviewId)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
                        fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
                        background: isActive ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        color: isActive ? '#a5b4fc' : '#6b7280',
                        transition: 'background 120ms, border-color 120ms, color 120ms',
                      }}
                    >
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                        background: STATUS_DOT_COLOR[status],
                      }} />
                      {roundLabel(iv)}
                    </button>
                  )
                })}
              </div>

              {/* Feedback panel for the selected round */}
              {selected && (
                <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <RoundFeedbackPanel selected={selected} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
