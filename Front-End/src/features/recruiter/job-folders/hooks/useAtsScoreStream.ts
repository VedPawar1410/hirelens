import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { subscribeAtsScoreStream } from '../../candidates/api/candidatesApi'
import { candidateQueryKeys } from '../../candidates/utils/candidateQueryKeys'
import type { CandidateList } from '../../candidates/api/candidatesApi'
import type { Candidate, CandidateStatus } from '../../../../shared/types/index'

function applyUpdates(updates: Map<string, Candidate>) {
  return (prev: InfiniteData<CandidateList> | undefined) => {
    if (!prev) return prev
    return {
      ...prev,
      pages: prev.pages.map(page => ({
        ...page,
        candidates: page.candidates.map(c => {
          const u = updates.get(c.id)
          return u ? { ...c, matchScore: u.matchScore } : c
        }),
      })),
    }
  }
}

export function useAtsScoreStream(jobId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    return subscribeAtsScoreStream(jobId, (batch: Candidate[]) => {
      const updatesByStatus = new Map<string, Map<string, Candidate>>()
      for (const c of batch) {
        if (!updatesByStatus.has(c.status)) updatesByStatus.set(c.status, new Map())
        updatesByStatus.get(c.status)!.set(c.id, c)
      }

      updatesByStatus.forEach((updates, status) => {
        queryClient.setQueryData(
          candidateQueryKeys.byStage(jobId, status as CandidateStatus),
          applyUpdates(updates)
        )
      })

      if (batch.length > 0) {
        queryClient.invalidateQueries({ queryKey: candidateQueryKeys.stageCounts(jobId) })
      }
    })
  }, [jobId, queryClient])
}
