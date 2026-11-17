export function getMatchScoreStyle(score: number | null): { color: string; bg: string } {
  if (score === null) return { color: '#6b7280', bg: 'rgba(156,163,175,0.08)' }
  if (score >= 80) return { color: '#22c55e', bg: 'rgba(20,83,45,0.2)' }
  if (score >= 60) return { color: '#6ea8fe', bg: 'rgba(29,43,164,0.18)' }
  return { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' }
}

/** ATS score sentinels stored by the backend (see AtsScoreWorker). */
export const SCORE_PENDING = -1
export const SCORE_NEEDS_REVIEW = -3

/**
 * Label for a non-numeric score state, or null when `score` is a real 0-100 score.
 * -1 = scoring in progress, -3 = flagged as a possible prompt injection (held for human
 * review, no score), any other negative = scoring failed.
 */
export function getScoreStatus(score: number): { label: string; color: string; title: string } | null {
  if (score >= 0) return null
  if (score === SCORE_PENDING) return { label: '...', color: '#9ca3af', title: 'Scoring in progress' }
  if (score === SCORE_NEEDS_REVIEW) {
    return { label: 'Review', color: '#f59e0b', title: 'Possible prompt injection in this resume - check it manually' }
  }
  return { label: 'Failed', color: '#f87171', title: 'Scoring failed' }
}
