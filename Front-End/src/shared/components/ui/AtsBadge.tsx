import { Bot } from 'lucide-react'
import { getMatchScoreStyle, getScoreStatus } from '../../lib/matchScoreUtils'

export function AtsBadge({ score }: Readonly<{ score: number | null }>) {
  if (score === null) return null
  // Negative values are states, not scores: never render "-1% ATS".
  const status = getScoreStatus(score)
  if (status) {
    return (
      <div
        className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-[20px]"
        style={{ background: 'rgba(156,163,175,0.1)', border: `1px solid ${status.color}28` }}
        title={status.title}
      >
        <Bot size={11} style={{ color: status.color }} />
        <span className="text-[11px] font-semibold tracking-wide" style={{ color: status.color }}>
          {status.label === '...' ? 'Scoring...' : `ATS: ${status.label}`}
        </span>
      </div>
    )
  }
  const { color, bg } = getMatchScoreStyle(score)
  return (
    <div
      className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-[20px]"
      style={{ background: bg, border: `1px solid ${color}28` }}
    >
      <Bot size={11} style={{ color }} />
      <span className="text-[11px] font-semibold tracking-wide" style={{ color }}>
        {score}% ATS
      </span>
    </div>
  )
}
