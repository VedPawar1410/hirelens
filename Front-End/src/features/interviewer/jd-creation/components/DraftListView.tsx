import type { JDDraft } from '../../../../shared/types'

interface Props {
  readonly drafts: JDDraft[]
  readonly isLoading: boolean
  readonly onSelect: (draft: JDDraft) => void
  readonly selectedId: string | null
}

const LEVEL_LABELS: Record<JDDraft['experienceLevel'], string> = {
  intern: 'Intern',
  fresher: 'Fresher',
  experienced: 'Experienced',
}

function waitingBadgeClass(days: number): string {
  if (days === 0) return 'bg-[rgba(34,197,94,0.12)] text-[#4ade80]'
  if (days <= 2) return 'bg-[rgba(245,158,11,0.12)] text-[#fbbf24]'
  return 'bg-[rgba(239,68,68,0.12)] text-[#f87171]'
}

function daysWaiting(createdAt: string): { days: number; label: string } {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
  return { days, label: days === 0 ? 'New today' : `${days}d waiting` }
}

function timeAgo(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime()
  const hours = Math.floor(ms / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 0) return 'Today'
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function AssignedCard({
  draft,
  isSelected,
  onClick,
}: Readonly<{
  draft: JDDraft
  isSelected: boolean
  onClick: () => void
}>) {
  const { days, label: waitLabel } = daysWaiting(draft.createdAt)
  const isSaved = draft.roleDescription.trim().length > 0

  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left border rounded-[14px] py-3 px-4 transition-[background,border-color] duration-150 cursor-pointer bg-transparent',
        isSelected
          ? 'bg-[rgba(29,43,164,0.12)] border-[rgba(29,43,164,0.4)]'
          : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[13px] font-semibold text-white m-0 leading-snug">{draft.jobTitle}</p>
        {isSaved && (
          <span className="bg-[rgba(34,197,94,0.15)] text-[#22c55e] rounded-full py-px px-2 text-[10px] font-semibold shrink-0 leading-5">
            SAVED
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="bg-[#1e3a5f] text-[#93c5fd] rounded-full py-px px-2 text-[10px] font-medium">
          {LEVEL_LABELS[draft.experienceLevel]}
        </span>
        <span
          className={`rounded-full py-px px-2 text-[10px] font-medium ${waitingBadgeClass(days)}`}
        >
          {waitLabel}
        </span>
      </div>
      <p className="text-[11px] text-[#6b7280] m-0">
        {draft.location}–{draft.workMode}
      </p>
      <p className="text-[11px] text-[#6b7280] m-0 mt-0.5">
        {waitLabel} · from {draft.createdBy}
      </p>
    </button>
  )
}

function SubmittedCard({ draft }: Readonly<{ draft: JDDraft }>) {
  const statusMeta =
    draft.status === 'finalized'
      ? { label: 'Finalised', color: '#22c55e' }
      : { label: 'Pending review', color: '#f59e0b' }

  return (
    <div className="border border-[rgba(255,255,255,0.05)] rounded-[14px] py-3 px-4 bg-[rgba(255,255,255,0.01)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-[#9ca3af] m-0">{draft.jobTitle}</p>
        <span className="text-[10px] font-medium shrink-0" style={{ color: statusMeta.color }}>
          {statusMeta.label}
        </span>
      </div>
      <p className="text-[11px] text-[#4b5563] m-0 mt-1">{timeAgo(draft.createdAt)}</p>
    </div>
  )
}

function SectionHeader({ title }: Readonly<{ title: string }>) {
  return (
    <p className="text-[10px] font-semibold text-[#4b5563] tracking-widest uppercase m-0 mb-2 px-1">
      {title}
    </p>
  )
}

export function DraftListView({ drafts, isLoading, onSelect, selectedId }: Readonly<Props>) {
  const assigned = drafts.filter((d) => d.status === 'assigned')
  const submitted = drafts.filter((d) => d.status === 'returned' || d.status === 'finalized')

  if (isLoading && drafts.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-shimmer h-22 rounded-[14px]" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionHeader title="Assigned to me" />
        {assigned.length === 0 ? (
          <p className="text-[12px] text-[#4b5563] px-1 m-0">No JDs assigned yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {assigned.map((d) => (
              <AssignedCard
                key={d.id}
                draft={d}
                isSelected={selectedId === d.id}
                onClick={() => onSelect(d)}
              />
            ))}
          </div>
        )}
      </div>

      {submitted.length > 0 && (
        <div>
          <SectionHeader title="Recently Submitted" />
          <div className="flex flex-col gap-2">
            {submitted.map((d) => (
              <SubmittedCard key={d.id} draft={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
