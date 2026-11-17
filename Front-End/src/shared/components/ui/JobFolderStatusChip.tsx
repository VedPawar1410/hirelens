import type { JobFolderStatus } from '../../types/index'

const STATUS_CLASSES: Record<JobFolderStatus, { chip: string; dot: string }> = {
  active: {
    chip: 'text-[#22c55e] bg-[rgba(20,83,45,0.2)] border-[rgba(34,197,94,0.25)]',
    dot: 'bg-[#22c55e]',
  },
  paused: {
    chip: 'text-[#d97706] bg-[rgba(217,119,6,0.15)] border-[rgba(217,119,6,0.3)]',
    dot: 'bg-[#d97706]',
  },
  closed: {
    chip: 'text-[#9ca3af] bg-[rgba(156,163,175,0.08)] border-[#37373f]',
    dot: 'bg-[#9ca3af]',
  },
}

export function JobFolderStatusChip({ status }: { readonly status: JobFolderStatus }) {
  const s = STATUS_CLASSES[status] ?? STATUS_CLASSES.active
  return (
    <span className={`inline-flex items-center gap-[5px] py-1 px-[10px] rounded-[20px] text-xs font-medium border whitespace-nowrap ${s.chip}`}>
      <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
