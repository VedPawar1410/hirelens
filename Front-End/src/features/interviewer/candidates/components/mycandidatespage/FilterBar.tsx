import { Calendar, ChevronRight } from 'lucide-react'
export type { FilterKey } from '../../types'

export function FilterChip({
  label, count, active, onClick,
}: Readonly<{
  label: string
  count: number
  active: boolean
  onClick: () => void
}>) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.25 px-3 py-1.25 text-xs font-medium rounded-full cursor-pointer whitespace-nowrap shrink-0"
      style={{
        background: active ? 'rgba(124,109,250,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(124,109,250,0.35)' : 'rgba(255,255,255,0.08)'}`,
        color: active ? '#c4b5fd' : '#9ca3af',
        transition: 'all 150ms',
      }}
    >
      {label}
      {count > 0 && (
        <span
          className="text-[10px] font-bold rounded-full px-1.25 py-px min-w-4 text-center leading-none"
          style={{
            background: active ? 'rgba(124,109,250,0.25)' : 'rgba(255,255,255,0.08)',
            color: active ? '#c4b5fd' : '#6b7280',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

export function ScheduleViewButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button
      onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.08)'; el.style.color = '#e5e7eb' }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = '#9ca3af' }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.75 text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#9ca3af',
        transition: 'background 150ms, color 150ms',
      }}
    >
      <Calendar style={{ width: 14, height: 14 }} />
      Schedule view
    </button>
  )
}

export function StartWithOldestButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(246,173,85,0.25)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(246,173,85,0.16)' }}
      onClick={onClick}
      className="flex items-center gap-1.25 px-3 py-1.5 text-xs font-semibold rounded-[7px] cursor-pointer shrink-0"
      style={{
        background: 'rgba(246,173,85,0.16)',
        border: '1px solid rgba(246,173,85,0.35)',
        color: '#F6AD55',
        transition: 'background 150ms',
      }}
    >
      Start with oldest
      <ChevronRight style={{ width: 13, height: 13 }} />
    </button>
  )
}
