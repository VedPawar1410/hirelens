import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { COLUMNS, STATUS_CHIP } from '../../utils/jobFolderUtils'
import { CandidateListRow } from './CandidateListRow'
import { useColumnCandidates } from '../../../candidates/hooks/useColumnCandidates'
import type { Candidate, CandidateStatus } from '../../../../../shared/types/index'

export interface CandidateListPaneProps {
  readonly jobId: string
  readonly selectedStage: CandidateStatus
  readonly onSelectStage: (stage: CandidateStatus) => void
  readonly selectedCandidateId: string | null
  readonly isMobile: boolean
  // prevId/nextId are passed for mobile navigation to the full detail page
  readonly onCandidateClick: (candidate: Candidate, prevId?: string, nextId?: string) => void
}

export function CandidateListPane({
  jobId,
  selectedStage, onSelectStage,
  selectedCandidateId, isMobile, onCandidateClick,
}: CandidateListPaneProps) {
  const stageChip = STATUS_CHIP[selectedStage]
  const stageLabel = COLUMNS.find(c => c.status === selectedStage)?.label ?? selectedStage

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [prevStage, setPrevStage] = useState(selectedStage)
  if (prevStage !== selectedStage) {
    setPrevStage(selectedStage)
    setSearch('')
    setDebouncedSearch('')
  }

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useColumnCandidates(jobId, selectedStage, debouncedSearch)

  const candidates = useMemo(
    () => data?.pages.flatMap(p => p.candidates) ?? [],
    [data]
  )
  const total = data?.pages[0]?.total ?? 0
  const isComputingScores = candidates.some(c => c.matchScore === null)

  const handleRowClick = useCallback((candidate: Candidate) => {
    const idx = candidates.findIndex(c => c.id === candidate.id)
    const prevId = idx > 0 ? candidates[idx - 1].id : undefined
    const nextId = idx < candidates.length - 1 ? candidates[idx + 1].id : undefined
    onCandidateClick(candidate, prevId, nextId)
  }, [candidates, onCandidateClick])

  function renderMobileStageSelector() {
    return (
      <div style={{ display: 'flex', overflowX: 'auto', gap: 6, paddingBottom: 12, marginBottom: 10 }}>
        {COLUMNS.map(col => {
          const chip = STATUS_CHIP[col.status]
          const isSelected = col.status === selectedStage
          return (
            <button
              key={col.status}
              onClick={() => onSelectStage(col.status)}
              style={{
                padding: '5px 11px', borderRadius: 20, flexShrink: 0,
                border: `1px solid ${isSelected ? chip.color : 'rgba(255,255,255,0.1)'}`,
                background: isSelected ? chip.bg : 'transparent',
                color: isSelected ? chip.color : '#9ca3af',
                fontSize: 12, fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {col.label}
            </button>
          )
        })}
      </div>
    )
  }

  function renderContent() {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-shimmer" style={{ height: 68, margin: '1px 0' }} />
          ))}
        </div>
      )
    }
    if (candidates.length === 0) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: 8, padding: '40px 20px',
        }}>
          <p style={{ fontSize: 13, color: '#4b5563', textAlign: 'center', margin: 0 }}>
            {debouncedSearch ? `No candidates match "${debouncedSearch}"` : `No candidates in ${stageLabel}`}
          </p>
        </div>
      )
    }
    return (
      <>
        {candidates.map(candidate => (
          <CandidateListRow
            key={candidate.id}
            candidate={candidate}
            isSelected={candidate.id === selectedCandidateId && !isMobile}
            onClick={() => handleRowClick(candidate)}
            isComputingScores={isComputingScores}
          />
        ))}
        {hasNextPage && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: isFetchingNextPage ? '#4b5563' : '#9ca3af',
                cursor: isFetchingNextPage ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {isFetchingNextPage
                ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</>
                : `Load more (${total - candidates.length} remaining)`
              }
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <div style={{
      flex: 1, minWidth: isMobile ? '100%' : 280,
      display: 'flex', flexDirection: 'column',
      borderRight: isMobile ? 'none' : '1px solid #37373f',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {isMobile && renderMobileStageSelector()}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f3f4f6' }}>{stageLabel}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
              background: stageChip.bg, color: stageChip.color,
            }}>
              {isLoading ? '–' : total}
            </span>
            {isComputingScores && (
              <span style={{ fontSize: 10, color: '#6b7280' }}>scoring…</span>
            )}
          </div>
          {!isLoading && candidates.length > 0 && candidates.length < total && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
              {candidates.length} of {total}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 7 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '7px 11px',
          }}>
            <Search size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search candidates…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e5e7eb', fontSize: 12 }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.3)', display: 'flex' }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderContent()}
      </div>
    </div>
  )
}
