import type { CandidateStatus } from '../../../../shared/types/index'

export const candidateQueryKeys = {
  all: ['candidates'] as const,
  byJob: (jobId: string) =>
    ['candidates', jobId] as const,
  byStage: (jobId: string, status: CandidateStatus, search = '') =>
    ['candidates', jobId, 'stage', status, { search }] as const,
  stageCounts: (jobId: string) =>
    ['candidates', jobId, 'stage-counts'] as const,
}
