import { useState } from 'react'
import { Search, Briefcase } from 'lucide-react'
import type { JDDraft } from '../../../../shared/types/index'

interface JDPickerStepProps {
  readonly jds: JDDraft[]
  readonly isLoading: boolean
  readonly selectedId: string | null
  readonly onSelect: (jd: JDDraft) => void
}

// Maps experience level codes to human-readable labels for display in the card badge.
const EXPERIENCE_LABELS: Record<string, string> = {
  intern: 'Intern',
  fresher: 'Fresher',
  experienced: 'Experienced',
}

export default function JDPickerStep({ jds, isLoading, selectedId, onSelect }: JDPickerStepProps) {
  const [search, setSearch] = useState('')

  const filtered = jds.filter(jd =>
    jd.jobTitle.toLowerCase().includes(search.toLowerCase())
  )

  function renderContent() {
    if (isLoading) {
      // Skeleton placeholders prevent layout shift while the query resolves
      return [0, 1, 2].map(i => (
        <div key={i} className="h-14 bg-[#1a1b1e] border border-[#37373f] rounded-[10px] opacity-50" />
      ))
    }
    if (filtered.length === 0) {
      return (
        <div className="py-6 text-center text-[13px] text-[#6b7280]">
          {jds.length === 0 ? 'No published JDs yet. Finalize a JD first.' : 'No JDs match your search.'}
        </div>
      )
    }
    return filtered.map(jd => {
      const isSelected = jd.id === selectedId
      return (
        <button
          key={jd.id}
          onClick={() => onSelect(jd)}
          className={`flex items-center gap-3 py-3 px-[14px] rounded-[10px] cursor-pointer text-left w-full transition-[border-color] duration-[120ms] border ${
            isSelected
              ? 'bg-[rgba(29,43,164,0.1)] border-[#1d2ba4]'
              : 'bg-[#1a1b1e] border-[#37373f] hover:border-[rgba(29,43,164,0.45)]'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-[rgba(29,43,164,0.15)] flex items-center justify-center shrink-0">
            <Briefcase size={14} className="text-[#6ea8fe]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white m-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {jd.jobTitle}
            </p>
            <span className="inline-block mt-[3px] text-[11px] text-[#9ca3af] bg-[#242529] rounded px-[6px] py-[1px]">
              {EXPERIENCE_LABELS[jd.experienceLevel] ?? jd.experienceLevel}
            </span>
          </div>
        </button>
      )
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          size={13}
          className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search job title…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full py-2 pr-3 pl-[30px] bg-[#1a1b1e] border border-[#37373f] rounded-lg text-[13px] text-[#d1d5db] outline-none box-border focus:border-[rgba(29,43,164,0.6)] transition-[border-color] duration-150"
        />
      </div>

      <div className="max-h-[260px] overflow-y-auto flex flex-col gap-2">
        {renderContent()}
      </div>
    </div>
  )
}
