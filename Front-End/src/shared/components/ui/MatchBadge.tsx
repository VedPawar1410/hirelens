import { Bot } from 'lucide-react'
import type React from 'react'
import { getScoreStatus } from '../../lib/matchScoreUtils'

export function MatchBadge({ score }: { readonly score: number | null }): React.ReactElement | null {
  if (score === null) return null
  const status = getScoreStatus(score)
  if (status) {
    return (
      <span
        className="inline-flex items-center justify-center min-w-[52px] h-[28px] rounded-full text-[11px] font-semibold px-2"
        style={{ background: 'rgba(156,163,175,0.1)', color: status.color }}
        title={status.title}
      >
        {status.label}
      </span>
    )
  }
  let color: string
  let bg: string
  if (score >= 80) { color = '#22c55e'; bg = 'rgba(20,83,45,0.25)' }
  else if (score >= 60) { color = '#6ea8fe'; bg = 'rgba(29,43,164,0.2)' }
  else { color = '#9ca3af'; bg = 'rgba(156,163,175,0.1)' }
  return (
    <div className="flex items-center gap-[5px]">
      <span
        className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-full text-xs font-bold"
        style={{ background: bg, color }}
      >
        {score}%
      </span>
      {score >= 80 && <Bot size={13} className="text-[#6ea8fe]" />}
    </div>
  )
}


