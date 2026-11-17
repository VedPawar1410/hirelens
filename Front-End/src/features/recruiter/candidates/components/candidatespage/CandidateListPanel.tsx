import type { ReactNode } from 'react'
import type { Virtualizer } from '@tanstack/react-virtual'
import { CandidateCard } from './CandidateCard'
import { CandidateRow } from './CandidateRow'
import type { Candidate, CandidateStatus } from '../../../../../shared/types/index'

type StatusTab = CandidateStatus | ''

interface Props {
  readonly tableContainerRef: React.RefObject<HTMLDivElement | null>
  readonly cardContainerRef: React.RefObject<HTMLDivElement | null>
  readonly rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  readonly cardVirtualizer: Virtualizer<HTMLDivElement, Element>
  readonly candidates: Candidate[]
  readonly isPending: boolean
  readonly isTablet: boolean
  readonly isMobile: boolean
  readonly colSpan: number
  readonly headers: string[]
  readonly debouncedSearch: string
  readonly activeStatus: StatusTab
  readonly showTopAts: boolean
  readonly onNextStage: (id: string, jobId?: string) => void
  readonly onShortlist: (id: string, jobId?: string) => void
  readonly onReject: (id: string, jobId?: string) => void
  readonly onView: (candidate: Candidate) => void
}

export function CandidateListPanel({
  tableContainerRef, cardContainerRef, rowVirtualizer, cardVirtualizer,
  candidates, isPending, isTablet, isMobile, colSpan, headers,
  debouncedSearch, activeStatus, showTopAts,
  onNextStage, onShortlist, onReject, onView,
}: Props) {
  const virtualRows = rowVirtualizer.getVirtualItems()
  const rowsToRender = virtualRows.length > 0
    ? virtualRows
    : candidates.slice(0, 50).map((_, index) => ({ index }))
  const paddingTop = virtualRows[0]?.start ?? 0
  const paddingBottom = virtualRows.length > 0
    ? rowVirtualizer.getTotalSize() - (virtualRows.at(-1)?.end ?? 0)
    : 0
  const virtualCards = cardVirtualizer.getVirtualItems()
  const cardsToRender = virtualCards.length > 0
    ? virtualCards
    : candidates.slice(0, 30).map((_, index) => ({ index }))
  const cardPaddingTop = virtualCards[0]?.start ?? 0
  const cardPaddingBottom = virtualCards.length > 0
    ? cardVirtualizer.getTotalSize() - (virtualCards.at(-1)?.end ?? 0)
    : 0

  const noResultsMsg = debouncedSearch || activeStatus || showTopAts
    ? 'No candidates match your filters.'
    : 'No candidates yet.'

  let mobileContent: ReactNode
  if (isPending) {
    mobileContent = <div className="py-8 px-4 text-center text-[#6b7280] text-[13px]">Loading candidates…</div>
  } else if (candidates.length === 0) {
    mobileContent = <div className="py-12 px-4 text-center text-[#6b7280] text-sm">{noResultsMsg}</div>
  } else {
    mobileContent = (
      <>
        <div style={{ height: cardPaddingTop }} />
        {cardsToRender.map(vCard => {
          const c = candidates[vCard.index]
          return (
            <CandidateCard
              key={`${c.id}::${c.appliedJob?.id ?? ''}`}
              candidate={c}
              isLast={vCard.index === candidates.length - 1}
              onNextStage={() => onNextStage(c.id, c.appliedJob?.id)}
              onShortlist={() => onShortlist(c.id, c.appliedJob?.id)}
              onReject={() => onReject(c.id, c.appliedJob?.id)}
              onView={onView}
              isNextDisabled={c.status === 'interviewing'}
            />
          )
        })}
        <div style={{ height: cardPaddingBottom }} />
      </>
    )
  }

  let tableBodyContent: ReactNode
  if (isPending) {
    tableBodyContent = (
      <tr>
        <td colSpan={colSpan} className="py-8 px-6 text-center text-[#6b7280] text-[13px]">
          Loading candidates…
        </td>
      </tr>
    )
  } else if (candidates.length === 0) {
    tableBodyContent = (
      <tr>
        <td colSpan={colSpan} className="py-12 px-6 text-center text-[#6b7280] text-sm">
          {noResultsMsg}
        </td>
      </tr>
    )
  } else {
    tableBodyContent = (
      <>
        <tr><td colSpan={colSpan} style={{ height: paddingTop, padding: 0 }} /></tr>
        {rowsToRender.map(vRow => {
          const c = candidates[vRow.index]
          return (
            <CandidateRow
              key={`${c.id}::${c.appliedJob?.id ?? ''}`}
              candidate={c}
              isLast={vRow.index === candidates.length - 1}
              isTablet={isTablet}
              onNextStage={(id) => onNextStage(id, c.appliedJob?.id)}
              onShortlist={(id) => onShortlist(id, c.appliedJob?.id)}
              onReject={(id) => onReject(id, c.appliedJob?.id)}
              onView={onView}
              isNextDisabled={c.status === 'interviewing'}
              innerRef={(el) => {
                if (el) el.dataset['index'] = String(vRow.index)
                rowVirtualizer.measureElement(el)
              }}
            />
          )
        })}
        <tr><td colSpan={colSpan} style={{ height: paddingBottom, padding: 0 }} /></tr>
      </>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-0.75">
      <div className="flex-1 min-h-0 flex flex-col bg-[#161719] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
        {isMobile ? (
          <div
            ref={cardContainerRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
            style={{ minHeight: 400 }}
          >
            {mobileContent}
          </div>
        ) : (
          <div
            ref={tableContainerRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-auto"
            style={{ minHeight: 400 }}
          >
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                {isTablet ? (
                  <>
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '21%' }} />
                    <col style={{ width: '29%' }} />
                  </>
                ) : (
                  <>
                    <col style={{ width: '24%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '19%' }} />
                  </>
                )}
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#1a1b1e] border-b border-[#37373f]">
                  {headers.map(h => (
                    <th key={h} className="py-2.75 px-4 text-left text-[11px] font-semibold text-[#6b7280] tracking-[0.06em] whitespace-nowrap select-none">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableBodyContent}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
