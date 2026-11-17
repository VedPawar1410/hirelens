import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { UploadProgressProvider, useUploadProgress } from '../UploadProgressContext'

vi.mock('../../../features/recruiter/job-folders/api/jobsApi', () => ({
  uploadResumes: vi.fn(),
}))

import { uploadResumes } from '../../../features/recruiter/job-folders/api/jobsApi'

const BATCHES_DONE = 2
const BATCHES_TOTAL = 5

function wrap(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <UploadProgressProvider>{children}</UploadProgressProvider>
    </QueryClientProvider>
  )
}

describe('UploadProgressProvider', () => {
  let qc: QueryClient

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    vi.mocked(uploadResumes).mockReset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    qc.clear()
  })

  it('renders children', () => {
    render(
      <QueryClientProvider client={qc}>
        <UploadProgressProvider><div>child</div></UploadProgressProvider>
      </QueryClientProvider>
    )
    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => useUploadProgress(), { wrapper: wrap(qc) })
    expect(result.current.isActive).toBe(false)
    expect(result.current.isComplete).toBe(false)
    expect(result.current.batchesDone).toBe(0)
    expect(result.current.batchesTotal).toBe(0)
    expect(result.current.activeJobId).toBeNull()
  })

  it('useUploadProgress throws when used outside a provider', () => {
    expect(() => renderHook(() => useUploadProgress())).toThrow(/useUploadProgress must be used inside UploadProgressProvider/)
  })

  it('startUpload sets active state and records jobId', () => {
    vi.mocked(uploadResumes).mockReturnValue(new Promise(() => undefined))
    const { result } = renderHook(() => useUploadProgress(), { wrapper: wrap(qc) })

    act(() => {
      result.current.startUpload([new File(['a'], 'a.pdf')], 'job-1')
    })

    expect(result.current.isActive).toBe(true)
    expect(result.current.activeJobId).toBe('job-1')
    expect(uploadResumes).toHaveBeenCalledTimes(1)
  })

  it('batch progress callback updates batchesDone/batchesTotal', () => {
    vi.mocked(uploadResumes).mockImplementation((_files, _jobId, onBatch) => {
      onBatch?.(BATCHES_DONE, BATCHES_TOTAL)
      return new Promise(() => undefined)
    })
    const { result } = renderHook(() => useUploadProgress(), { wrapper: wrap(qc) })

    act(() => { result.current.startUpload([new File(['a'], 'a.pdf')], 'job-1') })

    expect(result.current.batchesDone).toBe(BATCHES_DONE)
    expect(result.current.batchesTotal).toBe(BATCHES_TOTAL)
  })

  it('completed upload marks isComplete and calls onComplete', async () => {
    const completionResult = { processed: 2, results: [] }
    vi.mocked(uploadResumes).mockResolvedValue(completionResult)
    const { result } = renderHook(() => useUploadProgress(), { wrapper: wrap(qc) })
    const onComplete = vi.fn()

    await act(async () => {
      result.current.startUpload([new File(['a'], 'a.pdf')], 'job-1', onComplete)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.isComplete).toBe(true)
    expect(onComplete).toHaveBeenCalledWith(completionResult)
  })

  it('failed upload still marks isComplete', async () => {
    vi.mocked(uploadResumes).mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useUploadProgress(), { wrapper: wrap(qc) })

    await act(async () => {
      result.current.startUpload([new File(['a'], 'a.pdf')], 'job-1')
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.isComplete).toBe(true)
  })

  it('dismiss() returns state to idle', () => {
    vi.mocked(uploadResumes).mockReturnValue(new Promise(() => undefined))
    const { result } = renderHook(() => useUploadProgress(), { wrapper: wrap(qc) })

    act(() => { result.current.startUpload([new File(['a'], 'a.pdf')], 'j') })
    expect(result.current.isActive).toBe(true)

    act(() => { result.current.dismiss() })
    expect(result.current.isActive).toBe(false)
    expect(result.current.activeJobId).toBeNull()
  })

  it('auto-dismisses 4s after completion', async () => {
    vi.mocked(uploadResumes).mockResolvedValue({ processed: 1, results: [] })
    const { result } = renderHook(() => useUploadProgress(), { wrapper: wrap(qc) })

    await act(async () => {
      result.current.startUpload([new File(['a'], 'a.pdf')], 'job-1')
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(result.current.isComplete).toBe(true)

    await act(async () => { vi.advanceTimersByTime(4000) })
    expect(result.current.isActive).toBe(false)
  })
})
