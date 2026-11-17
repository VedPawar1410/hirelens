import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react'
import type { JobRound } from '../../types'
import { ROUND_TYPE_OPTIONS } from '../../constants/interviewConstants'

const FIELD_STYLE = { background: '#1a1b1e', border: '1px solid #37373f', color: '#d1d5db', transition: 'border-color 120ms' } as const

function renumber(rounds: JobRound[]): JobRound[] {
  return rounds.map((r, i) => ({ ...r, order: i + 1 }))
}

function moveRound(rounds: JobRound[], from: number, to: number): JobRound[] {
  if (to < 0 || to >= rounds.length) return rounds
  const next = [...rounds]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return renumber(next)
}

function focusBorder(e: React.FocusEvent<HTMLElement>) { e.currentTarget.style.borderColor = 'rgba(110,168,254,0.4)' }
function blurBorder(e: React.FocusEvent<HTMLElement>) { e.currentTarget.style.borderColor = '#37373f' }

interface IconBtnProps {
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly label: string
  readonly children: React.ReactNode
  readonly danger?: boolean
}

function IconBtn({ onClick, disabled, label, children, danger }: IconBtnProps) {
  const base = danger ? '#f87171' : '#6b7280'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="shrink-0 grid place-items-center w-7 h-8.5 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ background: 'transparent', border: '1px solid #37373f', color: base, transition: 'border-color 120ms, color 120ms' }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = danger ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = danger ? '#f87171' : '#9ca3af' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#37373f'; e.currentTarget.style.color = base }}
    >
      {children}
    </button>
  )
}

interface Props {
  readonly value: JobRound[]
  readonly onChange: (rounds: JobRound[]) => void
}

export function InterviewRoundsEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<JobRound>) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const remove = (i: number) => onChange(renumber(value.filter((_, idx) => idx !== i)))
  const add = () => onChange(renumber([...value, { order: value.length + 1, name: '', type: ROUND_TYPE_OPTIONS[0] }]))

  return (
    <div className="flex flex-col gap-1.75">
      {value.length === 0 && (
        <p className="text-[12px] text-[#6b7280] py-1">No rounds yet. Add the first round below.</p>
      )}

      {value.map((round, i) => (
        <div key={round.order} className="flex items-center gap-1.75">
          <GripVertical size={14} className="shrink-0 text-[#3f3f46]" />
          <span className="shrink-0 w-4.5 text-center text-[11px] font-semibold text-[#6b7280] tabular-nums">{i + 1}</span>

          <input
            type="text"
            value={round.name}
            onChange={e => update(i, { name: e.target.value })}
            placeholder="Round name, e.g. Tech Round 1"
            className="flex-1 min-w-0 rounded-lg py-2 px-2.75 text-[13px] outline-none"
            style={FIELD_STYLE}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />

          <select
            value={round.type}
            onChange={e => update(i, { type: e.target.value })}
            className="shrink-0 w-30.5 rounded-lg py-2 px-2.5 text-[13px] outline-none cursor-pointer appearance-none"
            style={FIELD_STYLE}
            onFocus={focusBorder}
            onBlur={blurBorder}
          >
            {ROUND_TYPE_OPTIONS.map(t => (
              <option key={t} value={t} style={{ background: '#1a1b1e', color: '#d1d5db' }}>{t}</option>
            ))}
          </select>

          <IconBtn label="Move round up" onClick={() => onChange(moveRound(value, i, i - 1))} disabled={i === 0}>
            <ChevronUp size={15} />
          </IconBtn>
          <IconBtn label="Move round down" onClick={() => onChange(moveRound(value, i, i + 1))} disabled={i === value.length - 1}>
            <ChevronDown size={15} />
          </IconBtn>
          <IconBtn label="Remove round" onClick={() => remove(i)} danger>
            <Trash2 size={14} />
          </IconBtn>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="mt-1 self-start flex items-center gap-1.5 py-2 px-3.25 rounded-lg text-[12px] font-semibold cursor-pointer"
        style={{ background: 'rgba(29,43,164,0.18)', border: '1px solid rgba(110,168,254,0.3)', color: '#6ea8fe', transition: 'background 120ms' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,43,164,0.3)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(29,43,164,0.18)' }}
      >
        <Plus size={14} />
        Add round
      </button>
    </div>
  )
}
