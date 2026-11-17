import { useQuery } from '@tanstack/react-query'
import { getInterviewsByInterviewer } from '../../recruiter/candidates/api/interviewsApi'
import type { InterviewWithDetails } from '../../recruiter/candidates/api/interviewsApi'

export function useInterviewerData(userId: string | undefined): {
  interviews: InterviewWithDetails[]
  isLoading: boolean
} {
  const { data, isLoading } = useQuery({
    queryKey: ['interviewer-interviews', userId],
    queryFn: () => getInterviewsByInterviewer(userId ?? ''),
    enabled: !!userId,
    staleTime: 60_000,
  })
  const raw = data ?? []
  const seen = new Map<string, InterviewWithDetails>()
  for (const iv of raw) {
    const key = `${iv.candidateId}:${iv.interviewRound}`
    const prev = seen.get(key)
    if (!prev || new Date(iv.createdAt) > new Date(prev.createdAt)) {
      seen.set(key, iv)
    }
  }
  return { interviews: [...seen.values()], isLoading }
}
