import { Bot } from 'lucide-react'
import { getMatchScoreStyle } from '../../lib/matchScoreUtils'

export function AtsBadge({ score }: Readonly<{ score: number | null }>) {
  if (score === null) return null
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
