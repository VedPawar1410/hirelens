import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Copy, Check, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { DownloadButton } from '../../../../shared/components/ui/DownloadButton'
import type { JDDraft } from '../../../../shared/types'

interface Props {
  readonly drafts: JDDraft[]
  readonly isLoading: boolean
  readonly copiedIds: Set<string>
  readonly onCopy: (id: string, text: string) => void
  readonly onEditFinalized: (draft: JDDraft) => void
  readonly onRetryGenerate: (draftId: string) => void
  readonly generatingDraftId: string | null
  readonly onDelete: (id: string) => void
  readonly isDeleting: boolean
  readonly isMobile?: boolean
  readonly hideHeader?: boolean
}

function SkeletonRow() {
  return (
    <div className="bg-[#161719] border border-[#37373f] rounded-[10px] py-3 px-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="skeleton-shimmer w-35 h-3.5 rounded" />
        <div className="skeleton-shimmer w-15 h-5 rounded-full" />
      </div>
      <div className="flex items-center gap-2.5">
        <div className="skeleton-shimmer w-14 h-5 rounded-full" />
        <div className="skeleton-shimmer w-7 h-7 rounded-md" />
      </div>
    </div>
  )
}

export function JDListPanel({ drafts, isLoading, copiedIds, onCopy, onEditFinalized, onRetryGenerate, generatingDraftId, onDelete, isDeleting, isMobile, hideHeader }: Props) {
  const [open, setOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const hasAutoOpened = useRef(false)

  // Auto-open once data arrives. Respects manual close after that.
  useEffect(() => {
    if (!hasAutoOpened.current && drafts.length > 0) {
      setOpen(true)
      hasAutoOpened.current = true
    }
  }, [drafts.length])

  const listVisible = hideHeader ? true : open

  let listContent: ReactNode
  if (isLoading && drafts.length === 0) {
    listContent = <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
  } else if (drafts.length === 0) {
    listContent = <p className="text-[#6b7280] text-[13px] py-3">No Jd&apos;s yet. Create your first one above.</p>
  } else {
    listContent = drafts.map((draft) => (
      <div key={draft.id} className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-0.5">
        <div
          className={`bg-[#161719] rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex items-center justify-between gap-4 hover:bg-[#1a1d20] transition-colors duration-150 ${
            isMobile ? 'flex-col items-start gap-2 py-2.5 px-3' : 'flex-row py-3 px-4'
          }`}
        >
          <div className={`flex items-center gap-3 flex-1 min-w-0 ${isMobile ? 'w-full' : ''}`}>
            <p className="text-sm font-semibold text-white m-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {draft.jobTitle || 'Untitled'}
            </p>
            <span className="bg-[#1a1d20] text-[#9ca3af] border border-[#37373f] rounded-full py-0.5 px-2.25 text-[11px] font-medium shrink-0">
              {draft.experienceLevel}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={draft.status} />

            {draft.status === 'draft' && (
              <button
                onClick={() => { onRetryGenerate(draft.id) }}
                disabled={generatingDraftId === draft.id}
                title="Retry JD generation"
                className={`flex items-center gap-1.25 py-1.25 px-2.5 rounded-[7px] text-xs font-semibold border border-[#37373f] bg-transparent transition-colors duration-150 ${
                  generatingDraftId === draft.id
                    ? 'text-[#6b7280] cursor-not-allowed'
                    : 'text-[#9ca3af] cursor-pointer hover:bg-[#1a1d20]'
                }`}
              >
                <RefreshCw
                  className="w-3 h-3"
                  style={{ animation: generatingDraftId === draft.id ? 'spin 1s linear infinite' : 'none' }}
                />
                {generatingDraftId === draft.id ? 'Generating...' : 'Retry'}
              </button>
            )}

            {draft.status === 'finalized' && draft.roleDescription && (
              <>
                <button
                  onClick={() => onCopy(draft.id, draft.roleDescription)}
                  title="Copy JD"
                  className={`flex items-center gap-1.25 py-1.25 px-2.5 rounded-[7px] text-xs font-semibold border border-[#37373f] bg-transparent cursor-pointer hover:bg-[#1a1d20] transition-colors duration-150 ${
                    copiedIds.has(draft.id) ? 'text-[#86efac]' : 'text-[#9ca3af]'
                  }`}
                >
                  {copiedIds.has(draft.id)
                    ? <Check className="w-3 h-3" />
                    : <Copy className="w-3 h-3" />
                  }
                  {copiedIds.has(draft.id) ? 'Copied!' : 'Copy'}
                </button>

                <button
                  onClick={() => onEditFinalized(draft)}
                  title="Edit JD"
                  className="flex items-center gap-1.25 py-1.25 px-2.5 rounded-[7px] text-xs font-semibold text-[#9ca3af] border border-[#37373f] bg-transparent cursor-pointer hover:bg-[#1a1d20] transition-colors duration-150"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>

                <DownloadButton draftId={draft.id} jobTitle={draft.jobTitle} />
              </>
            )}

            <span className="text-[11px] text-[#6b7280]">
              {new Date(draft.createdAt).toLocaleDateString()}
            </span>

            {pendingDeleteId === draft.id ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { onDelete(draft.id); setPendingDeleteId(null) }}
                  disabled={isDeleting}
                  className="px-2 py-0.75 rounded-md text-[11px] font-semibold text-[#ef4444] border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.08)] cursor-pointer"
                >
                  Delete
                </button>
                <button
                  onClick={() => setPendingDeleteId(null)}
                  className="px-2 py-0.75 rounded-md text-[11px] font-semibold text-[#9ca3af] border border-[#37373f] bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPendingDeleteId(draft.id)}
                disabled={isDeleting}
                title="Delete JD"
                className={`flex items-center justify-center w-7 h-7 rounded-md border border-[#37373f] bg-transparent text-[#6b7280] shrink-0 transition-[background,border-color,color] duration-150 ${
                  isDeleting
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer hover:bg-[rgba(239,68,68,0.1)] hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444]'
                }`}
              >
                <Trash2 className="w-3.25 h-3.25" />
              </button>
            )}
          </div>
        </div>
      </div>
    ))
  }

  return (
    <div className={hideHeader ? 'mt-0' : 'mt-10'}>
      {!hideHeader && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0 mb-4 hover:opacity-75 transition-opacity duration-150"
        >
          <div className="w-8 h-8 rounded-[9px] bg-[#1a1d20] border border-[#37373f] flex items-center justify-center">
            <ChevronDown
              className="w-3.5 h-3.5 text-[#9ca3af]"
              style={{
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
          </div>
          <div className="text-left">
            <span className="text-white text-base font-bold block">All JDs</span>
            <span className="text-[#9ca3af] text-xs">
              {isLoading ? 'Loading...' : `${drafts.length} total`}
            </span>
          </div>
        </button>
      )}

      {listVisible && (
        <div className="flex flex-col gap-1.5">
          {listContent}
        </div>
      )}
    </div>
  )
}
