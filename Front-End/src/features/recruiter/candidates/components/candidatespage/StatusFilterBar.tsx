import { Search } from 'lucide-react'
import type { CandidateStatus } from '../../../../../shared/types/index'

type StatusTab = CandidateStatus | ''

interface StageCounts {
  underReview: number
  filtered: number
  shortlisted: number
  interviewing: number
  selected: number
}

interface Props {
  readonly search: string
  readonly onSearchChange: (v: string) => void
  readonly activeStatus: StatusTab
  readonly onSetStatus: (s: StatusTab) => void
  readonly countsData: StageCounts | undefined
}

const STAGE_CHIPS = [
  { label: 'Under Review', value: 'under_review' as CandidateStatus, countKey: 'underReview' as const },
  { label: 'Filtered',     value: 'filtered'     as CandidateStatus, countKey: 'filtered'     as const },
  { label: 'Shortlisted',  value: 'shortlisted'  as CandidateStatus, countKey: 'shortlisted'  as const },
  { label: 'Interviewing', value: 'interviewing' as CandidateStatus, countKey: 'interviewing' as const },
  { label: 'Selected',     value: 'selected'     as CandidateStatus, countKey: 'selected'      as const },
]

export function StatusFilterBar({ search, onSearchChange, activeStatus, onSetStatus, countsData }: Props) {
  return (
    <div className="flex items-center gap-3 mb-4 animate-[fade-up_0.45s_cubic-bezier(0.34,1.56,0.64,1)_0.08s_both]">
      <div className="flex items-center gap-2.5 bg-[#161719] border border-[#37373f] focus-within:border-[#4b5563] rounded-3xl px-4 shrink-0 transition-colors duration-150 w-55">
        <Search size={14} className="text-[#6b7280] shrink-0" />
        <input
          type="text"
          placeholder="Search by name, role, or skill…"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="border-none bg-transparent text-[13px] text-[#d1d5db] placeholder-[#4b5563] py-2.25 w-full"
          style={{ outline: 'none' }}
        />
      </div>
      <div className="w-px h-5 bg-[#37373f] shrink-0" />
      <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:h-0" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => onSetStatus('')}
          className={[
            'inline-flex items-center py-1 px-2.5 rounded-[20px] text-[12px] cursor-pointer whitespace-nowrap shrink-0 border transition-all duration-150',
            activeStatus === ''
              ? 'border-transparent bg-[#1d2ba4] text-white font-semibold'
              : 'border-[#37373f] bg-transparent text-[#6b7280] font-normal hover:border-[rgba(29,43,164,0.4)] hover:text-[#9ca3af]',
          ].join(' ')}
        >
          All
        </button>
        {countsData && STAGE_CHIPS.map(({ label, value, countKey }) => (
          <button
            key={value}
            onClick={() => onSetStatus(activeStatus === value ? '' : value)}
            className={[
              'inline-flex items-center gap-1.25 py-1 px-2.5 rounded-[20px] text-[12px] cursor-pointer whitespace-nowrap shrink-0 border transition-all duration-150',
              activeStatus === value
                ? 'border-transparent bg-[#1d2ba4] text-white font-semibold'
                : 'border-[#37373f] bg-transparent text-[#6b7280] font-normal hover:border-[rgba(29,43,164,0.4)] hover:text-[#9ca3af]',
            ].join(' ')}
          >
            {label}
            <span className={[
              'text-[11px] font-semibold px-1.25 py-px rounded-full',
              activeStatus === value ? 'bg-[rgba(255,255,255,0.15)] text-white' : 'bg-[#37373f] text-[#9ca3af]',
            ].join(' ')}>
              {countsData[countKey]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
