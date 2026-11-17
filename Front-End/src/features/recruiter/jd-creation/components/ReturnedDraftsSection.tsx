import { useState } from 'react'
import { AlertTriangle, Sparkles, Trash2 } from 'lucide-react'
import { LEVEL_META } from '../constants/jd'
import type { JDDraft } from '../../../../shared/types'

interface Props {
  readonly drafts: JDDraft[]
  readonly generatingDraftId: string | null
  readonly onReview: (draft: JDDraft) => void
  readonly onCreateJD: (draftId: string) => void
  readonly onDelete: (id: string) => void
  readonly isDeleting: boolean
}

export function ReturnedDraftsSection({ drafts, generatingDraftId, onReview, onCreateJD, onDelete, isDeleting }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  if (drafts.length === 0) return null

  return (
    <div className="mb-6">
      {/* Compact banner */}
      <div
        className="flex items-center gap-3 py-2.5 px-4 rounded-xl"
        style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.18)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(234,179,8,0.15)' }}
        >
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
        </div>

        <p className="text-[13px] font-medium flex-1 m-0" style={{ color: '#e5e7eb' }}>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>
            {drafts.length} {drafts.length === 1 ? 'JD' : 'JDs'}
          </span>
          {' '}returned by interviewers – needs your review
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[12px] font-semibold px-3 py-1.25 rounded-[7px] cursor-pointer transition-[background] duration-150 border-none"
            style={{
              color: '#e5e7eb',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
          >
            Review Data
          </button>
          <button
            onClick={() => onReview(drafts[0])}
            className="text-[12px] font-semibold px-3 py-1.25 rounded-[7px] cursor-pointer transition-[background] duration-150 border-none"
            style={{
              color: '#fbbf24',
              background: 'rgba(234,179,8,0.12)',
              border: '1px solid rgba(234,179,8,0.3)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(234,179,8,0.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(234,179,8,0.12)' }}
          >
            Review JDs
          </button>
        </div>
      </div>

      {/* Expanded draft cards */}
      {expanded && (
        <div className="mt-3 flex flex-col gap-3">
          {drafts.map((draft) => {
            const meta = draft.experienceLevel ? LEVEL_META[draft.experienceLevel] : null
            const isGenerating = generatingDraftId === draft.id
            const isBusy = !!generatingDraftId

            return (
              <div
                key={draft.id}
                className="flex items-start justify-between gap-5 p-5 rounded-[14px]"
                style={{
                  background: '#161719',
                  border: '1px solid #37373f',
                  borderLeft: '3px solid #fbbf24',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="font-bold text-white text-[15px] m-0">{draft.jobTitle}</p>
                    {meta && (
                      <span
                        className="rounded-full py-0.5 px-2.5 text-[11px] font-semibold"
                        style={{ background: '#1e3a5f', color: '#93c5fd' }}
                      >
                        {meta.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[#6b7280] text-xs m-0 mb-2">
                    Assigned to: {draft.assignedTo.join(', ')}
                  </p>
                  {draft.roleDescription && (
                    <p className="text-[#d1d5db] text-[13px] m-0 leading-normal">
                      {draft.roleDescription.slice(0, 120)}
                      {draft.roleDescription.length > 120 ? '...' : ''}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  {pendingDeleteId === draft.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { onDelete(draft.id); setPendingDeleteId(null) }}
                        disabled={isDeleting || isBusy}
                        className="px-2 py-1 rounded-[7px] text-[12px] font-semibold cursor-pointer"
                        style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)' }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setPendingDeleteId(null)}
                        className="px-2 py-1 rounded-[7px] text-[12px] font-semibold cursor-pointer"
                        style={{ color: '#9ca3af', border: '1px solid #37373f', background: 'transparent' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPendingDeleteId(draft.id)}
                      disabled={isDeleting || isBusy}
                      title="Delete draft"
                      className="flex items-center justify-center w-8.5 h-8.5 rounded-lg transition-[border-color,color] duration-150 border-none"
                      style={{
                        background: 'transparent',
                        border: '1px solid #37373f',
                        color: isDeleting || isBusy ? '#4b5563' : '#6b7280',
                        cursor: isDeleting || isBusy ? 'not-allowed' : 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (!isDeleting && !isBusy) {
                          e.currentTarget.style.borderColor = '#ef4444'
                          e.currentTarget.style.color = '#ef4444'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#37373f'
                        e.currentTarget.style.color = isDeleting || isBusy ? '#4b5563' : '#6b7280'
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onReview(draft)}
                    className="text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer transition-[background] duration-150 border-none"
                    style={{
                      color: '#e5e7eb',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                  >
                    Review
                  </button>

                  <button
                    onClick={() => !isBusy && onCreateJD(draft.id)}
                    disabled={isBusy}
                    className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-lg transition-[background] duration-150 border-none"
                    style={{
                      color: '#fff',
                      background: isBusy ? '#2a2d32' : '#1d2ba4',
                      cursor: isBusy ? 'not-allowed' : 'pointer',
                      boxShadow: isBusy ? 'none' : '0 4px 12px rgba(29,43,164,0.3)',
                    }}
                  >
                    {isGenerating ? (
                      <span className="w-3.25 h-3.25 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full inline-block animate-spin" />
                    ) : (
                      <Sparkles className="w-3.25 h-3.25" />
                    )}
                    Create JD
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
