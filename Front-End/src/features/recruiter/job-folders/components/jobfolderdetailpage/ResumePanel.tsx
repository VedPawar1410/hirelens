import type { CSSProperties } from 'react'
import { AlertTriangle, X, FileText, CheckCircle2, Clock } from 'lucide-react'
import type { Resume } from '../../../jd-creation/api/resumeApi'

export type ResumeFilter = 'processed' | 'unprocessed' | 'failed'
export type FailedFile = { fileName: string; error: string }

export interface ResumePanelProps {
  readonly filter: ResumeFilter
  readonly resumes: Resume[]
  readonly failedFiles?: FailedFile[]
  readonly isLoading: boolean
  readonly onClose: () => void
  readonly isMobile: boolean
  readonly panelWidth: number
  readonly onClearFailedFile?: (index: number) => void
  readonly onClearAllFailed?: () => void
}

const ACCENT_COLORS: Record<ResumeFilter, string> = {
  failed: '#f87171',
  processed: '#22c55e',
  unprocessed: '#f59e0b',
}

const PANEL_TITLES: Record<ResumeFilter, string> = {
  failed: 'Failed Resumes',
  processed: 'Processed Resumes',
  unprocessed: 'Unprocessed Resumes',
}

function FilterIcon({ filter, size, className, style }: {
  readonly filter: ResumeFilter
  readonly size: number
  readonly className?: string
  readonly style?: CSSProperties
}) {
  if (filter === 'failed') return <AlertTriangle size={size} className={className} style={style} />
  if (filter === 'processed') return <CheckCircle2 size={size} className={className} style={style} />
  return <Clock size={size} className={className} style={style} />
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

export function ResumePanel({ filter, resumes, failedFiles = [], isLoading, onClose, isMobile, panelWidth, onClearFailedFile, onClearAllFailed }: ResumePanelProps) {
  const isFailed = filter === 'failed'
  const isProcessed = filter === 'processed'
  const shownResumes = isFailed ? [] : resumes.filter(r => r.status === filter)
  const shownFailed = isFailed ? failedFiles : []
  const count = isFailed ? shownFailed.length : shownResumes.length
  const accentColor = ACCENT_COLORS[filter]
  const title = PANEL_TITLES[filter]

  let countLabel: number | string = count
  if (isLoading && filter !== 'failed') countLabel = '–'

  function renderContent() {
    if (isLoading && !isFailed) {
      return [1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-shimmer h-16 rounded-[10px]" />
      ))
    }
    if (count === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12">
          <FilterIcon filter={filter} size={32} className="text-[#2a2d35]" />
          <p className="text-[13px] text-[#4b5563]">No {filter} resumes yet</p>
        </div>
      )
    }
    if (isFailed) {
      return shownFailed.map((f, i) => (
        <div key={f.fileName} className="flex items-center gap-3 py-3 px-3.5 bg-[#1a1b1e] border border-[rgba(239,68,68,0.2)] rounded-[10px]">
          <div className="w-9 h-9 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center shrink-0">
            <FileText size={15} style={{ color: accentColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[#d1d5db] m-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {f.fileName.includes('/') ? f.fileName.substring(f.fileName.lastIndexOf('/') + 1) : f.fileName}
            </p>
            <p className="text-[11px] text-[#f87171] m-0 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
              {f.error}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold text-[#f87171] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] rounded-md py-0.5 px-2 uppercase tracking-wider">
              Failed
            </span>
            {onClearFailedFile && (
              <button
                onClick={() => onClearFailedFile(i)}
                className="bg-none border-none cursor-pointer text-[#4b5563] flex p-0.5 hover:text-[#9ca3af] transition-colors duration-150"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      ))
    }
    return shownResumes.map(resume => (
      <div key={resume.id} className="flex items-center gap-3 py-3 px-3.5 bg-[#1a1b1e] border border-[#37373f] rounded-[10px]">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: isProcessed ? 'rgba(20,83,45,0.2)' : 'rgba(245,158,11,0.15)',
            border: `1px solid ${isProcessed ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}
        >
          <FileText size={15} style={{ color: accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[#d1d5db] m-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {resume.filename}
          </p>
          <p className="text-[11px] text-[#6b7280] m-0 mt-0.5">
            {formatDate(resume.uploadedAt)}
            {resume.errorReason && ` · ${resume.errorReason}`}
          </p>
        </div>
        {isProcessed && resume.matchScore !== null && (
          <span
            className="text-xs font-bold shrink-0"
            style={{ color: resume.matchScore >= 80 ? '#22c55e' : '#6ea8fe' }}
          >
            {resume.matchScore}%
          </span>
        )}
        {filter === 'unprocessed' && (
          <span className="text-[10px] font-semibold text-[#f59e0b] bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] rounded-md py-0.5 px-2 shrink-0 uppercase tracking-wider">
            Pending
          </span>
        )}
      </div>
    ))
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(0,0,0,0.4)] z-40 border-none p-0 cursor-default"
      />

      <div
        className={
          isMobile
            ? 'fixed bottom-0 left-0 right-0 h-[70vh] bg-[#161719] border-t border-[#37373f] z-40 flex flex-col overflow-y-auto shadow-[0_-16px_48px_rgba(0,0,0,0.5)]'
            : 'fixed top-0 right-0 bottom-0 bg-[#161719] border-l border-[#37373f] z-41 flex flex-col shadow-[-16px_0_48px_rgba(0,0,0,0.4)]'
        }
        style={isMobile ? undefined : { width: panelWidth }}
      >
        <div className="flex items-center justify-between py-4.5 px-5 border-b border-[#37373f] shrink-0">
          <div className="flex items-center gap-2.5">
            <FilterIcon filter={filter} size={16} style={{ color: accentColor }} />
            <div>
              <p className="text-sm font-semibold text-white m-0">{title}</p>
              <p className="text-xs text-[#6b7280] m-0 mt-0.5">
                {countLabel} resume{count === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isFailed && shownFailed.length > 0 && onClearAllFailed && (
              <button
                onClick={onClearAllFailed}
                className="bg-none border border-[rgba(239,68,68,0.25)] cursor-pointer text-[rgba(248,113,113,0.7)] flex items-center gap-1 py-1 px-2.5 rounded-md text-[11px] font-semibold hover:text-[#f87171] hover:border-[rgba(239,68,68,0.5)] transition-[color,border-color] duration-150"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-none border-none cursor-pointer text-[#6b7280] flex p-1 hover:text-[#9ca3af] transition-colors duration-150"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-5 flex flex-col gap-2">
          {renderContent()}
        </div>
      </div>
    </>
  )
}
