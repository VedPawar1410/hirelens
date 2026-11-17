export type FilterKey = 'all' | 'feedback' | 'upcoming' | 'past'
export type GroupKey = 'feedback' | 'upcoming' | 'past'

export const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All',
  feedback: 'Feedback pending',
  upcoming: 'Upcoming with me',
  past: 'Past – no action',
}

export const AVATAR_COLORS: Record<GroupKey, { color: string; bg: string; border: string }> = {
  feedback: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.25)' },
  upcoming: { color: '#a78bfa', bg: 'rgba(124,109,250,0.15)', border: 'rgba(124,109,250,0.25)' },
  past: { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.18)' },
}
