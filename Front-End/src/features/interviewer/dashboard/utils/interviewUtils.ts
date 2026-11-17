// Display name for an interview's round. Prefers the snapshotted round name,
// falling back to a generic label for legacy rows scheduled before names existed.
export function roundDisplayName(iv: { roundName?: string; interviewRound: number }): string {
  return iv.roundName?.trim() ? iv.roundName : `Round ${iv.interviewRound}`
}

export const STAGE_ABBREV: Record<string, string> = {
  under_review: 'Rev', filtered: 'Flt', shortlisted: 'Srt',
  interviewing: 'Intv', selected: 'Sel',
}

export function resolveTypeLabel(type: string) {
  const t = type.toLowerCase()
  if (t.includes('phone')) return 'Phone Screen'
  if (t.includes('person') || t.includes('onsite')) return 'In-Person'
  return 'Video Call'
}
