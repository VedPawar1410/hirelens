import { Search, Sparkles } from 'lucide-react'
import type { CandidateStatus } from '../../../../../shared/types/index'

type StatusTab = CandidateStatus | ''

const ALL_STATUSES: CandidateStatus[] = [
  'under_review', 'filtered', 'shortlisted', 'interviewing',
  'selected', 'rejected',
]

interface Props {
  readonly search: string
  readonly onSearchChange: (v: string) => void
  readonly activeStatus: StatusTab
  readonly onSetStatus: (s: StatusTab) => void
  readonly showTopAts: boolean
  readonly onToggleTopAts: () => void
}

export function MobileControls({ search, onSearchChange, activeStatus, onSetStatus, showTopAts, onToggleTopAts }: Props) {
  return (
    <div className="flex flex-col gap-3 mb-5">
      <div className="flex gap-2">
        <div className="flex items-center gap-2.5 bg-[#161719] border border-[#37373f] focus-within:border-[#4b5563] rounded-3xl px-4 flex-1 transition-colors duration-150">
          <Search size={14} className="text-[#6b7280] shrink-0" />
          <input
            type="text"
            placeholder="Search by name, role, or skill…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="border-none bg-transparent text-[13px] text-[#d1d5db] placeholder-[#4b5563] py-2.5 w-full"
            style={{ outline: 'none' }}
          />
        </div>
        <button
          onClick={onToggleTopAts}
          className={[
            'inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-[20px] text-[13px] cursor-pointer whitespace-nowrap shrink-0 border transition-all duration-150',
            showTopAts
              ? 'border-transparent bg-[rgba(217,119,6,0.85)] text-white font-semibold'
              : 'border-[rgba(251,191,36,0.3)] bg-[rgba(217,119,6,0.08)] text-[#fbbf24] font-normal',
          ].join(' ')}
        >
          <Sparkles size={13} />
          Top Picks
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:h-0" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => onSetStatus('')}
          className={['py-1.5 px-3.5 rounded-[20px] text-[13px] cursor-pointer whitespace-nowrap shrink-0 border transition-all duration-150', activeStatus === '' ? 'border-transparent bg-[#1d2ba4] text-white font-semibold' : 'border-[#37373f] bg-transparent text-[#9ca3af] font-normal'].join(' ')}
        >
          All
        </button>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => onSetStatus(activeStatus === s ? '' : s)}
            className={['py-1.5 px-3.5 rounded-[20px] text-[13px] cursor-pointer whitespace-nowrap shrink-0 border transition-all duration-150', activeStatus === s ? 'border-transparent bg-[#1d2ba4] text-white font-semibold' : 'border-[#37373f] bg-transparent text-[#9ca3af] font-normal'].join(' ')}
          >
            {s.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>
    </div>
  )
}
