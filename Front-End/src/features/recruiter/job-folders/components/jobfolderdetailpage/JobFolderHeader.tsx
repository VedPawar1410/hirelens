import { ArrowLeft, FileUp, AlertTriangle, CheckCircle2, Clock, ListChecks } from 'lucide-react'
import type { JobFolder } from '../../../../../shared/types/index'
import type { ResumeFilter } from './ResumePanel'

const FOLDER_STATUS_LABEL: Record<string, string> = { active: 'Active', paused: 'Paused', closed: 'Closed' }

interface FolderInfoProps {
  readonly folder: JobFolder | undefined
  readonly isLoading: boolean
  readonly isMobile: boolean
}

function FolderInfo({ folder, isLoading, isMobile }: FolderInfoProps) {
  if (isLoading) {
    return (
      <>
        <div className="skeleton-shimmer w-70 h-6.5 rounded-md mb-2.5" />
        <div className="skeleton-shimmer w-50 h-4 rounded-sm" />
      </>
    )
  }
  return (
    <>
      <h1 className={`font-bold text-white tracking-[-0.015em] mb-2.5 mt-0 ${isMobile ? 'text-[20px]' : 'text-[26px]'}`}>
        {folder?.jobTitle ?? 'Job Folder'}
      </h1>
      <div className="flex items-center gap-2 flex-wrap">
        {folder?.department && (
          <span className="py-0.75 px-2.5 bg-[#1e2028] border border-[#37373f] rounded-md text-xs text-[#d1d5db]">
            {folder.department}
          </span>
        )}
        {folder?.location && (
          <>
            <span className="text-[#4b5563] text-sm">•</span>
            <span className="text-xs text-[#9ca3af]">{folder.location}</span>
          </>
        )}
        {folder?.status && (
          <>
            <span className="text-[#4b5563] text-sm">•</span>
            <span
              className="flex items-center gap-1.25 text-xs font-medium"
              style={{ color: folder.status === 'active' ? '#34d399' : '#9ca3af' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: folder.status === 'active' ? '#34d399' : '#6b7280' }}
              />
              {FOLDER_STATUS_LABEL[folder.status] ?? folder.status}
            </span>
          </>
        )}
      </div>
    </>
  )
}

export interface JobFolderHeaderProps {
  readonly folder: JobFolder | undefined
  readonly isLoading: boolean
  readonly isMobile: boolean
  readonly resumePanel: ResumeFilter | null
  readonly processedCount: number
  readonly unprocessedCount: number
  readonly failedCount: number
  readonly resumesLoading: boolean
  readonly onPanelToggle: (filter: ResumeFilter) => void
  readonly onUploadOpen: () => void
  readonly onConfigureRounds: () => void
  readonly onBack: () => void
}

export function JobFolderHeader({
  folder, isLoading, isMobile,
  resumePanel, processedCount, unprocessedCount, failedCount, resumesLoading,
  onPanelToggle, onUploadOpen, onConfigureRounds, onBack,
}: JobFolderHeaderProps) {
  const sz = isMobile ? 'py-[7px] px-[10px] text-xs' : 'py-2 px-[14px] text-[13px]'

  return (
    <div className={`border-b border-[#37373f] shrink-0 ${isMobile ? 'py-3.5 px-4' : 'py-4.5 px-7'}`}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.25 bg-none border-none cursor-pointer text-[#6b7280] text-xs p-0 mb-3.5 hover:text-[#9ca3af] transition-colors duration-150"
      >
        <ArrowLeft size={13} />
        Job Folders
      </button>

      <div className={`flex items-start justify-between gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
        <div className="min-w-0 flex-1">
          <FolderInfo folder={folder} isLoading={isLoading} isMobile={isMobile} />
        </div>

        <div className={`flex items-center gap-2 shrink-0 ${isMobile ? 'flex-wrap' : 'flex-nowrap'}`}>
          <button
            onClick={() => onPanelToggle('processed')}
            className={`flex items-center gap-1.75 border border-[rgba(34,197,94,0.2)] text-[#22c55e] rounded-[9px] font-semibold cursor-pointer transition-[background,border-color] duration-150 ${sz} ${
              resumePanel === 'processed'
                ? 'bg-[rgba(20,83,45,0.25)] border-[rgba(34,197,94,0.4)]'
                : 'bg-[rgba(20,83,45,0.12)] hover:bg-[rgba(20,83,45,0.25)] hover:border-[rgba(34,197,94,0.4)]'
            }`}
          >
            <CheckCircle2 size={13} />
            {resumesLoading ? '–' : processedCount} Processed
          </button>

          <button
            onClick={() => onPanelToggle('unprocessed')}
            className={`flex items-center gap-1.75 border border-[rgba(245,158,11,0.2)] text-[#f59e0b] rounded-[9px] font-semibold cursor-pointer transition-[background,border-color] duration-150 ${sz} ${
              resumePanel === 'unprocessed'
                ? 'bg-[rgba(245,158,11,0.2)] border-[rgba(245,158,11,0.4)]'
                : 'bg-[rgba(245,158,11,0.08)] hover:bg-[rgba(245,158,11,0.2)] hover:border-[rgba(245,158,11,0.4)]'
            }`}
          >
            <Clock size={13} />
            {resumesLoading ? '–' : unprocessedCount} Unprocessed
          </button>

          <button
            onClick={() => onPanelToggle('failed')}
            className={`flex items-center gap-1.75 border border-[rgba(248,113,113,0.2)] text-[#f87171] rounded-[9px] font-semibold cursor-pointer transition-[background,border-color] duration-150 ${sz} ${
              resumePanel === 'failed'
                ? 'bg-[rgba(220,38,38,0.2)] border-[rgba(248,113,113,0.4)]'
                : 'bg-[rgba(220,38,38,0.08)] hover:bg-[rgba(220,38,38,0.2)] hover:border-[rgba(248,113,113,0.4)]'
            }`}
          >
            <AlertTriangle size={13} />
            {failedCount} Failed
          </button>

          <button
            onClick={onConfigureRounds}
            className={`flex items-center gap-1.75 border border-[#37373f] text-[#9ca3af] rounded-[9px] font-semibold cursor-pointer bg-transparent hover:border-[rgba(110,168,254,0.4)] hover:text-[#6ea8fe] transition-[background,border-color,color] duration-150 ${sz}`}
          >
            <ListChecks size={14} />
            Interview Rounds
          </button>

          <button
            onClick={onUploadOpen}
            className={`flex items-center gap-1.75 bg-[#1d2ba4] text-white border-none rounded-[9px] font-semibold cursor-pointer shadow-[0_4px_14px_rgba(29,43,164,0.35)] hover:bg-[#12219e] transition-colors duration-150 ${sz}`}
          >
            <FileUp size={14} />
            Upload Resumes
          </button>
        </div>
      </div>
    </div>
  )
}
