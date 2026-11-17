import type { CandidateStatus } from '../../../../shared/types/index'

export const STATUS_BADGE: Record<
  CandidateStatus,
  { label: string; color: string; bg: string }
> = {
  under_review: { label: 'Under Review', color: '#60a5fa', bg: 'rgba(29,43,164,0.15)' },
  filtered:     { label: 'Filtered',     color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
  shortlisted:  { label: 'Shortlisted',  color: '#a78bfa', bg: 'rgba(139,92,246,0.15)' },
  interviewing: { label: 'Interviewing', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  selected:     { label: 'Selected',     color: '#34d399', bg: 'rgba(20,83,45,0.2)' },
  rejected:     { label: 'Rejected',     color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
}

export const STAGE_ORDER: CandidateStatus[] = [
  'under_review', 'filtered', 'shortlisted', 'interviewing', 'selected',
]
