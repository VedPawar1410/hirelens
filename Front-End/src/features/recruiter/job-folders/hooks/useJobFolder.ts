import { useQuery } from '@tanstack/react-query'
import { getJobFolder } from '../api/jobsApi'
import { getResumes } from '../../jd-creation/api/resumeApi'

export function useJobFolder(jobId: string) {
  const folderQuery = useQuery({
    queryKey: ['job-folder', jobId],
    queryFn: () => getJobFolder(jobId),
    enabled: !!jobId,
    staleTime: 30_000,
  })

  const resumesQuery = useQuery({
    queryKey: ['resumes', jobId],
    queryFn: () => getResumes(jobId),
    enabled: !!jobId,
    staleTime: 30_000,
  })

  return {
    folder: folderQuery.data ?? null,
    isFolderLoading: folderQuery.isLoading,
    resumes: resumesQuery.data ?? [],
    isResumesLoading: resumesQuery.isLoading,
    refetchResumes: resumesQuery.refetch,
  }
}
