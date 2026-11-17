import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { uploadResumes } from '../../features/recruiter/job-folders/api/jobsApi'
import { jobsQueryKeys } from '../../features/recruiter/job-folders/api/jobsQueryKeys'

interface UploadProgressState {
  isActive: boolean
  batchesDone: number
  batchesTotal: number
  isComplete: boolean
  activeJobId: string | null
}

interface UploadProgressContextValue extends UploadProgressState {
  startUpload: (
    files: File[],
    jobId: string | undefined,
    onComplete?: (result: import('../../features/recruiter/job-folders/api/jobsApi').UploadResult) => void,
  ) => void
  dismiss: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const UploadProgressContext = createContext<UploadProgressContextValue | null>(null)

const IDLE: UploadProgressState = {
  isActive: false,
  batchesDone: 0,
  batchesTotal: 0,
  isComplete: false,
  activeJobId: null,
}

export function UploadProgressProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<UploadProgressState>(IDLE)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    setState(IDLE)
  }, [])

  const startUpload = useCallback((
    files: File[],
    jobId: string | undefined,
    onComplete?: (result: import('../../features/recruiter/job-folders/api/jobsApi').UploadResult) => void,
  ) => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)

    setState({ isActive: true, batchesDone: 0, batchesTotal: 0, isComplete: false, activeJobId: jobId ?? null })

    uploadResumes(
      files,
      jobId,
      // onBatchComplete — update the live counter
      (done, total) => setState(prev => ({ ...prev, batchesDone: done, batchesTotal: total })),
      // onBatchResult — immediately make the new candidates visible in the UI
      (batchResults) => {
        if (jobId) queryClient.invalidateQueries({ queryKey: ['resumes', jobId] })
        queryClient.invalidateQueries({ queryKey: ['candidates'] })
        // Invalidate job folders so candidatesCount and topCandidates stay fresh per batch
        if (batchResults.some(r => r.atsScore !== null)) {
          queryClient.invalidateQueries({ queryKey: ['jobs'] })
        }
      },
    )
      .then((result) => {
        queryClient.invalidateQueries({ queryKey: jobsQueryKeys.all() })
        setState(prev => ({ ...prev, isComplete: true }))
        onComplete?.(result)
        dismissTimer.current = setTimeout(dismiss, 4000)
      })
      .catch(() => {
        setState(prev => ({ ...prev, isComplete: true }))
        dismissTimer.current = setTimeout(dismiss, 4000)
      })
  }, [queryClient, dismiss])

  const contextValue = useMemo(
    () => ({ ...state, startUpload, dismiss }),
    [state, startUpload, dismiss],
  )

  return (
    <UploadProgressContext.Provider value={contextValue}>
      {children}
    </UploadProgressContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUploadProgress() {
  const ctx = useContext(UploadProgressContext)
  if (!ctx) throw new Error('useUploadProgress must be used inside UploadProgressProvider')
  return ctx
}
