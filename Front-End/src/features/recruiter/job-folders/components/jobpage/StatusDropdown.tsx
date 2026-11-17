import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { STATUS_CONFIG } from '../../utils/jobsUtils'
import type { JobFolder, JobFolderStatus } from '../../../../../shared/types/index'

export function StatusDropdown({
  folder,
  onStatusChange,
}: Readonly<{
  folder: JobFolder
  onStatusChange: (id: string, status: JobFolderStatus) => void
}>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cfg = STATUS_CONFIG[folder.status]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          borderRadius: 999, padding: '4px 10px',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', cursor: 'pointer',
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
        {cfg.label}
        <ChevronDown size={9} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          background: '#1c1e24', border: '1px solid #37373f',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          minWidth: 140, padding: '4px 0', zIndex: 1000,
        }}>
          {(['active', 'paused', 'closed'] satisfies JobFolderStatus[]).map(s => {
            const c = STATUS_CONFIG[s]
            return (
              <button
                key={s}
                type="button"
                onClick={e => { e.stopPropagation(); onStatusChange(folder.id, s); setOpen(false) }}
                style={{ width: '100%', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#d1d5db', margin: '0 4px', borderRadius: 6, background: 'transparent', border: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{c.label}</span>
                {folder.status === s && <Check size={12} style={{ color: '#6ea8fe' }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
