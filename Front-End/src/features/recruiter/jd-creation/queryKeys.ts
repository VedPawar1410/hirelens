export const DRAFTS_ALL_QUERY_KEY = ['drafts', 'all'] as const

export const interviewerDraftsQueryKey = (username: string | undefined) =>
  ['drafts', 'interviewer', username] as const
