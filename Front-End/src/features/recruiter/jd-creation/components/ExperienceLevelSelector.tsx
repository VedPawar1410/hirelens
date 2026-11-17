import type { ExperienceLevel } from '../../../../shared/types'

interface Props {
  readonly selected: ExperienceLevel | null
  readonly onSelect: (level: ExperienceLevel) => void
  readonly fieldsFilled?: number
  readonly fieldsTotal?: number
}

const LEVELS: { level: ExperienceLevel; label: string }[] = [
  { level: 'intern',      label: 'Intern' },
  { level: 'fresher',     label: 'Fresher' },
  { level: 'experienced', label: 'Experienced' },
]

export function ExperienceLevelSelector({ selected, onSelect, fieldsFilled = 0, fieldsTotal = 0 }: Props) {
  const progressPct = fieldsTotal > 0 ? Math.round((fieldsFilled / fieldsTotal) * 100) : 0
  const isComplete = fieldsTotal > 0 && fieldsFilled === fieldsTotal

  return (
    <div className="flex items-center gap-4 mb-7 flex-wrap">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280] shrink-0">
        Experience
      </span>

      <div
        className="flex items-center gap-1 rounded-full p-1"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {LEVELS.map(({ level, label }) => {
          const isActive = selected === level
          return (
            <button
              key={level}
              onClick={(e) => { e.stopPropagation(); onSelect(level) }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150 cursor-pointer border-none outline-none"
              style={{
                background: isActive ? '#1d2ba4' : 'transparent',
                color: isActive ? '#ffffff' : '#9ca3af',
                boxShadow: isActive ? '0 2px 8px rgba(29,43,164,0.35)' : 'none',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#e5e7eb' }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#9ca3af' }}
            >
              {isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#6ea8fe] shrink-0"
                  style={{ boxShadow: '0 0 6px rgba(110,168,254,0.8)' }}
                />
              )}
              {label}
            </button>
          )
        })}
      </div>

      {selected && fieldsTotal > 0 && (
        <div className="ml-auto flex items-center gap-2.5">
          <span
            className="text-[12px] font-semibold tabular-nums"
            style={{ color: isComplete ? '#86efac' : '#9ca3af' }}
          >
            {fieldsFilled}/{fieldsTotal} fields
          </span>
          <div className="w-20 h-0.75 bg-[#37373f] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${progressPct}%`,
                background: isComplete
                  ? 'linear-gradient(90deg, #166534, #86efac)'
                  : 'linear-gradient(90deg, #1d2ba4, #6ea8fe)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
