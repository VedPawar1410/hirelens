export function getMatchScoreStyle(score: number | null): { color: string; bg: string } {
  if (score === null) return { color: '#6b7280', bg: 'rgba(156,163,175,0.08)' }
  if (score >= 80) return { color: '#22c55e', bg: 'rgba(20,83,45,0.2)' }
  if (score >= 60) return { color: '#6ea8fe', bg: 'rgba(29,43,164,0.18)' }
  return { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' }
}
