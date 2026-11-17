function getScoreColor(score: number): string {
  if (score >= 80) return '#34d385'
  if (score >= 50) return '#fbbf24'
  return '#f87171'
}

export function ScoreBadge({ score, isComputing }: { readonly score: number | null; readonly isComputing?: boolean }) {
  if (score === null) {
    return (
      <span style={{ fontSize: 11, color: isComputing ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
        {isComputing ? '…' : '—'}
      </span>
    )
  }
  const color = getScoreColor(score)
  return (
    <span style={{
      fontSize: 13, fontWeight: 700, color,
      background: `${color}15`,
      border: `1px solid ${color}35`,
      borderRadius: 8, padding: '2px 8px',
      lineHeight: 1.5, flexShrink: 0,
    }}>
      {score}
    </span>
  )
}

export function SourceBadge({ source }: { readonly source: string }) {
  const isLinkedIn = source.includes('LinkedIn')
  return (
    <span style={{
      fontSize: 10, fontWeight: 600,
      color: isLinkedIn ? '#60a5fa' : 'rgba(255,255,255,0.35)',
      background: isLinkedIn ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${isLinkedIn ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 5, padding: '2px 7px',
      whiteSpace: 'nowrap' as const, flexShrink: 0,
    }}>
      {isLinkedIn ? 'LinkedIn' : 'Direct Upload'}
    </span>
  )
}
