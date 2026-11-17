import { useState } from 'react'
import type { ReactNode } from 'react'
import { useWindowSize } from '../../hooks/useWindowSize'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Edit3, Check, Copy } from 'lucide-react'
import { finalizeDraft } from '../../../features/recruiter/jd-creation/api/jdApi'
import { useToast } from '../../hooks/useToast'
import { PrimaryButton } from '../ui/PrimaryButton'
import { ApiError } from '../../types/api'
import type { JDDraft } from '../../types/index'

interface Props {
  readonly draftId: string
  readonly previewJD: string
  readonly draft: JDDraft
  readonly queryKey: readonly unknown[]
  readonly onClose: () => void
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  let offset = 0
  return parts.map((part) => {
    const key = String(offset)
    offset += part.length
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>
    }
    return <span key={key}>{part}</span>
  })
}

function getSidebarOffset(width: number): number {
  if (width >= 1024) return 240
  if (width >= 768) return 64
  return 0
}

function renderPreviewText(text: string): ReactNode[] {
  const lines = text.split('\n')
  const result: ReactNode[] = []
  let k = 0

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      result.push(<div key={k++} className="h-3" />)
      continue
    }

    const bulletExec = /^[-•*]\s+(.+)$/.exec(trimmed)
    const colonIndex = trimmed.indexOf(':')
    const isLabelRow =
      colonIndex > 0 &&
      colonIndex < 40 &&
      trimmed.slice(0, colonIndex).split(/\s+/).length <= 5 &&
      !trimmed.endsWith(':')
    const wordCount = trimmed.split(/\s+/).length
    const isHeading =
      wordCount <= 6 &&
      !/[.:!?]$/.test(trimmed) &&
      !trimmed.startsWith('**') &&
      /^[A-Za-z][A-Za-z0-9'&/ -]+$/.test(trimmed)
    const headingMarginTop = result.length === 0 ? 0 : '18px'

    if (bulletExec) {
      result.push(
        <div key={k++} className="grid grid-cols-[14px_1fr] gap-2.5 items-start my-1">
          <span className="text-[#6ea8fe] font-bold leading-[1.7]">•</span>
          <span>{renderInlineMarkdown(bulletExec[1])}</span>
        </div>
      )
    } else if (isLabelRow) {
      const label = trimmed.slice(0, colonIndex).replaceAll('**', '').trim()
      const value = trimmed
        .slice(colonIndex + 1)
        .replace(/^\s*\*\*\s?/, '')
        .replace(/\s*\*\*$/, '')
        .trim()
      result.push(
        <div key={k++} className="grid grid-cols-[160px_1fr] gap-3 mb-2">
          <span className="text-[#f3f4f6] font-bold">{label}</span>
          <span className="text-[#e5e7eb]">{renderInlineMarkdown(value)}</span>
        </div>
      )
    } else if (isHeading) {
      result.push(
        <div
          key={k++}
          className="mb-2 text-white text-sm font-bold tracking-[0.02em]"
          style={{ marginTop: headingMarginTop }}
        >
          {renderInlineMarkdown(trimmed)}
        </div>
      )
    } else {
      result.push(
        <p key={k++} className="mb-2.5">
          {renderInlineMarkdown(trimmed)}
        </p>
      )
    }
  }

  return result
}

export function JDPreviewModal({ draftId, previewJD, draft, queryKey, onClose }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedJD, setEditedJD] = useState(previewJD)
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { width } = useWindowSize()
  const sidebarOffset = getSidebarOffset(width)

  async function handleCopy() {
    await navigator.clipboard.writeText(editedJD)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const finalizeMutation = useMutation({
    // The finalize endpoint requires the full draft payload alongside the approved JD text —
    // the backend uses it to create a finalized record rather than mutating the draft in place
    mutationFn: (finalJD: string) =>
      finalizeDraft(draftId, {
        finalJD,
        experienceLevel: draft.experienceLevel,
        jobTitle: draft.jobTitle,
        location: draft.location,
        workMode: draft.workMode,
        workHours: draft.workHours,
        duration: draft.duration,
        stipendSalary: draft.stipendSalary,
        fulltimeOfferSalary: draft.fulltimeOfferSalary,
        yearsOfExperience: draft.yearsOfExperience,
        noticePeriod: draft.noticePeriod,
        relevantExperience: draft.relevantExperience,
        roleDescription: draft.roleDescription,
        assignedTo: draft.assignedTo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      showToast('Job description finalized successfully.', 'success')
      onClose()
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Finalize failed, try again'
      showToast(msg, 'error')
    },
  })

  return (
    <div
      className="fixed top-0 right-0 bottom-0 bg-black/70 z-1000 flex items-center justify-center p-6"
      style={{ left: sidebarOffset }}
    >
      <div className="bg-[#161719] border border-[#37373f] rounded-2xl w-full max-w-195 max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#37373f] shrink-0">
          <span className="text-white text-[15px] font-bold">JD Preview</span>

          <div className="flex gap-2 items-center">
            {/* Copy */}
            <button
              onClick={handleCopy}
              className={[
                'flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-[13px] font-semibold bg-transparent border border-[#37373f] cursor-pointer',
                'transition-[border-color] duration-150 hover:border-[#6b7280]',
                copied ? 'text-[#86efac]' : 'text-[#9ca3af]',
              ].join(' ')}
            >
              {copied ? <Check className="w-3.25 h-3.25" /> : <Copy className="w-3.25 h-3.25" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            {/* Edit toggle */}
            <button
              onClick={() => setIsEditing((v) => !v)}
              className={[
                'flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-[13px] font-semibold cursor-pointer border',
                'transition-[border-color] duration-150',
                isEditing
                  ? 'text-[#6ea8fe] bg-[rgba(29,43,164,0.12)] border-[rgba(29,43,164,0.4)] hover:border-[rgba(29,43,164,0.6)]'
                  : 'text-[#9ca3af] bg-transparent border-[#37373f] hover:border-[#6b7280]',
              ].join(' ')}
            >
              <Edit3 className="w-3.25 h-3.25" />
              {isEditing ? 'Preview' : 'Edit'}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="bg-transparent border-none text-[#6b7280] cursor-pointer p-1 hover:text-white transition-colors duration-150"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-7">
          <div className="text-[#e5e7eb] text-sm leading-[1.7] min-h-[52vh] w-full flex items-stretch">
            {isEditing ? (
              <textarea
                value={editedJD}
                onChange={(e) => setEditedJD(e.target.value)}
                className="w-full min-h-[52vh] h-full bg-transparent border-none text-inherit p-0 m-0 leading-[inherit] resize-none outline-none box-border"
              />
            ) : (
              <div className="w-full box-border pr-1.5">
                {renderPreviewText(editedJD)}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4.5 border-t border-[#37373f] flex justify-end shrink-0">
          <PrimaryButton
            onClick={() => finalizeMutation.mutate(editedJD)}
            loading={finalizeMutation.isPending}
            loadingText="Finalizing..."
          >
            <Check className="w-3.5 h-3.5" />
            Approve & Finalize
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
