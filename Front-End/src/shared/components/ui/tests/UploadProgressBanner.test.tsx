import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadProgressBanner } from '../UploadProgressBanner'
import { UploadProgressContext } from '../../../context/UploadProgressContext'

function withContext(value: Parameters<typeof UploadProgressContext.Provider>[0]['value'], ui: ReactNode) {
  return <UploadProgressContext.Provider value={value}>{ui}</UploadProgressContext.Provider>
}

function makeCtx(overrides = {}) {
  return {
    isActive: true,
    batchesDone: 1,
    batchesTotal: 3,
    isComplete: false,
    activeJobId: null,
    startUpload: vi.fn(),
    dismiss: vi.fn(),
    ...overrides,
  }
}

describe('UploadProgressBanner', () => {
  it('renders nothing when not active', () => {
    const { container } = render(withContext(makeCtx({ isActive: false }), <UploadProgressBanner />))
    expect(container.firstChild).toBeNull()
  })

  it('shows "Processing resumes" while in progress', () => {
    render(withContext(makeCtx(), <UploadProgressBanner />))
    expect(screen.getByText('Processing resumes')).toBeInTheDocument()
    expect(screen.getByText('Batch 1 of 3 complete')).toBeInTheDocument()
  })

  it('shows "Starting upload…" when batchesTotal=0', () => {
    render(withContext(makeCtx({ batchesTotal: 0 }), <UploadProgressBanner />))
    expect(screen.getByText('Starting upload…')).toBeInTheDocument()
  })

  it('shows complete state with dismiss button', async () => {
    const dismiss = vi.fn()
    render(withContext(makeCtx({ isComplete: true, dismiss }), <UploadProgressBanner />))
    expect(screen.getByText('Upload complete')).toBeInTheDocument()
    expect(screen.getByText('All 3 batches processed')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button'))
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  it('shows singular "batch" for batchesTotal=1 when complete', () => {
    render(withContext(makeCtx({ batchesTotal: 1, isComplete: true }), <UploadProgressBanner />))
    expect(screen.getByText('All 1 batch processed')).toBeInTheDocument()
  })

  it('does not render the dismiss button while in progress', () => {
    render(withContext(makeCtx(), <UploadProgressBanner />))
    expect(screen.queryByRole('button')).toBeNull()
  })
})
