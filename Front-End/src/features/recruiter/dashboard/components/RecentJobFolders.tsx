import { Briefcase, ArrowUpRight, MoveRight } from 'lucide-react'
import { JobFolderStatusChip } from '../../../../shared/components/ui/JobFolderStatusChip'
import type { JobFolder } from '../../../../shared/types'
import { useWindowSize } from '../../../../shared/hooks/useWindowSize'

interface RecentJobFoldersProps {
  readonly folders: JobFolder[]
  readonly isLoading: boolean
  readonly onViewAll: () => void
  readonly onFolderClick: (id: string) => void
}

export default function RecentJobFolders({
  folders,
  isLoading,
  onViewAll,
  onFolderClick,
}: RecentJobFoldersProps) {
  const { width } = useWindowSize()
  const isMobile = width < 640
  const hideCount = width < 400

  let listContent
  if (isLoading) {
    listContent = (
      <div className="py-4 px-6 flex flex-col gap-2.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-shimmer h-13 rounded-lg" />
        ))}
      </div>
    )
  } else if (folders.length === 0) {
    listContent = (
      <div className="py-10 px-6 text-center text-[#6b7280] text-[13px]">
        No job folders yet
      </div>
    )
  } else {
    listContent = folders.map((folder, idx) => (
      <button
        type="button"
        key={folder.id}
        className={[
          'w-full text-left bg-transparent border-none flex items-center cursor-pointer transition-[background] duration-150 ease hover:bg-[rgba(255,255,255,0.02)]',
          isMobile ? 'gap-2.5 py-2.5 px-3.5' : 'gap-3.5 py-2.5 px-5',
          idx < folders.length - 1 ? 'border-b border-[#37373f]' : '',
        ].join(' ')}
        onClick={() => onFolderClick(folder.id)}
      >
        <div
          className={[
            'rounded-[10px] bg-[rgba(29,43,164,0.15)] border border-[rgba(29,43,164,0.3)] flex items-center justify-center shrink-0',
            isMobile ? 'w-8 h-8' : 'w-10 h-10',
          ].join(' ')}
        >
          <Briefcase size={isMobile ? 14 : 17} className="text-[#6ea8fe]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-white mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap ${isMobile ? 'text-[13px]' : 'text-sm'}`}>
            {folder.jobTitle}
          </p>
          <p className="text-xs text-[#9ca3af] overflow-hidden text-ellipsis whitespace-nowrap">
            {[folder.department, folder.location].filter(Boolean).join(' · ')}
          </p>
        </div>

        {!hideCount && (
          <div className="text-right shrink-0">
            <p className="text-base font-bold text-white [font-variant-numeric:tabular-nums] leading-none">
              {folder.candidatesCount}
            </p>
            <p className="text-[11px] text-[#6b7280]">candidates</p>
          </div>
        )}

        <JobFolderStatusChip status={folder.status} />

        <ArrowUpRight size={15} className="text-[#6b7280] shrink-0" />
      </button>
    ))
  }

  return (
    <div className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-0.75">
      <div className="bg-[#161719] rounded-2xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
        <div className={`flex justify-between items-center border-b border-[#37373f] ${isMobile ? 'py-2.5 px-3.5' : 'py-3 px-5'}`}>
          <h3 className="text-sm font-semibold text-white">Recent Job Folders</h3>
          <button
            onClick={onViewAll}
            className="bg-transparent border-none text-[13px] text-[#6ea8fe] cursor-pointer font-medium flex items-center gap-1 hover:text-[#93c5fd] hover:gap-2 transition-[color,gap] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          >
            View all
            <MoveRight size={13} />
          </button>
        </div>
        {listContent}
      </div>
    </div>
  )
}
