import { useInfiniteQuery } from '@tanstack/react-query'
import { getCandidates } from '../api/candidatesApi'
import { candidateQueryKeys } from '../utils/candidateQueryKeys'
import type { CandidateStatus } from '../../../../shared/types/index'

export type { CandidateList } from '../api/candidatesApi'

export const COLUMN_PAGE_SIZE = 30

export function useColumnCandidates(jobId: string, status: CandidateStatus, search = '') {
  return useInfiniteQuery({
    queryKey: candidateQueryKeys.byStage(jobId, status, search),
    queryFn: ({ pageParam }) =>
      getCandidates({ jobId, status, search, page: pageParam, limit: COLUMN_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.limit
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
    staleTime: 30_000,
    // keep showing previous results while new search/page loads
    placeholderData: (prev) => prev,
  })
}
