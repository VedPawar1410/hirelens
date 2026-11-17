import { ChevronDown } from 'lucide-react'
import { JDListPanel } from './JDListPanel'
import type { JDDraft } from '../../../../shared/types'

interface JDListSectionProps {
  readonly drafts: JDDraft[]
  readonly isLoading: boolean
  readonly copiedIds: Set<string>
  readonly isMobile: boolean
  readonly showJdList: boolean
  readonly onToggleList: () => void
  readonly generatingDraftId: string | null
  readonly isDeleting: boolean
  readonly onCopy: (id: string, text: string) => void
  readonly onEditFinalized: (draft: JDDraft) => void
  readonly onRetryGenerate: (id: string) => void
  readonly onDelete: (id: string) => void
}

export function JDListSection({
  drafts, isLoading, copiedIds, isMobile, showJdList, onToggleList,
  generatingDraftId, isDeleting, onCopy, onEditFinalized, onRetryGenerate, onDelete,
}: JDListSectionProps) {
  if (isMobile) {
    return (
      <>
        <button
          onClick={onToggleList}
          className={`flex items-center justify-between gap-2 w-full mt-10 bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[10px] py-2.5 px-4 cursor-pointer text-[#e5e7eb] text-sm font-semibold hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-150 ${showJdList ? 'mb-3' : 'mb-0'}`}
        >
          <span>Show All JDs ({drafts.length})</span>
          <ChevronDown
            className="w-3.5 h-3.5 text-[#9ca3af]"
            style={{
              transform: showJdList ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          />
        </button>
        {showJdList && (
          <JDListPanel
            drafts={drafts}
            isLoading={isLoading}
            copiedIds={copiedIds}
            onCopy={onCopy}
            onEditFinalized={onEditFinalized}
            onRetryGenerate={onRetryGenerate}
            generatingDraftId={generatingDraftId}
            onDelete={onDelete}
            isDeleting={isDeleting}
            isMobile={isMobile}
            hideHeader
          />
        )}
      </>
    )
  }

  return (
    <JDListPanel
      drafts={drafts}
      isLoading={isLoading}
      copiedIds={copiedIds}
      onCopy={onCopy}
      onEditFinalized={onEditFinalized}
      onRetryGenerate={onRetryGenerate}
      generatingDraftId={generatingDraftId}
      onDelete={onDelete}
      isDeleting={isDeleting}
      isMobile={false}
    />
  )
}
