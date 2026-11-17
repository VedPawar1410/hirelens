interface SubmittedFeedbackViewProps {
  readonly heading: string
  readonly rating: number | null
  readonly recommendation: string
  readonly notes: string | null
}

const RATING_SLOTS = [1, 2, 3, 4, 5] as const

export function SubmittedFeedbackView({ heading, rating, recommendation, notes }: SubmittedFeedbackViewProps) {
  const isPositive = recommendation === 'StrongHire' || recommendation === 'Hire'
  const isNoHire = recommendation === 'NoHire'
  const negativeColor = isNoHire ? '#f87171' : '#9ca3af'
  const recColor = isPositive ? '#4ade80' : negativeColor
  const negativeBg = isNoHire ? 'rgba(239,68,68,0.08)' : 'rgba(100,116,139,0.15)'
  const recBg = isPositive ? 'rgba(74,222,128,0.08)' : negativeBg
  const score = rating ?? 0

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] font-bold tracking-widest uppercase m-0" style={{ color: '#9ca3af' }}>{heading}</p>
      <div className="flex gap-1.5">
        {RATING_SLOTS.map(n => (
          <div key={n} style={{
            flex: 1, padding: '9px 0', borderRadius: 8, textAlign: 'center',
            fontSize: 12, fontWeight: 600,
            background: score >= n ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${score >= n ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.06)'}`,
            color: score >= n ? '#a5b4fc' : 'rgba(255,255,255,0.15)',
          }}>{n}</div>
        ))}
      </div>
      {notes && (
        <p className="text-[13px] italic leading-relaxed m-0" style={{ color: 'rgba(255,255,255,0.55)' }}>
          "{notes}"
        </p>
      )}
      <span style={{
        display: 'inline-block', padding: '4px 14px', borderRadius: 999,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
        background: recBg, color: recColor, border: `1px solid ${recColor}33`,
      }}>
        {recommendation}
      </span>
    </div>
  )
}
