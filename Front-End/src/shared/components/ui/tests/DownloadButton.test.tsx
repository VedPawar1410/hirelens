import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DownloadButton } from '../DownloadButton'
import { ToastContext } from '../../Toast/ToastProvider'
import { ApiError } from '../../../types/api'

vi.mock('../../../../features/recruiter/jd-creation/api/jdApi', () => ({
  getPdf: vi.fn(),
}))

import { getPdf } from '../../../../features/recruiter/jd-creation/api/jdApi'

function withToast(showToast: (message: string, type: string) => void, ui: ReactNode) {
  return (
    <ToastContext.Provider value={{ showToast }}>
      {ui}
    </ToastContext.Provider>
  )
}

describe('DownloadButton', () => {
  beforeEach(() => {
    vi.mocked(getPdf).mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders default label', () => {
    render(withToast(vi.fn(), <DownloadButton draftId="d1" jobTitle="Engineer" />))
    expect(screen.getByRole('button', { name: /Download PDF/ })).toBeInTheDocument()
  })

  it('calls getPdf with draftId on click', async () => {
    vi.mocked(getPdf).mockResolvedValue(new Blob(['pdf']))
    render(withToast(vi.fn(), <DownloadButton draftId="d-42" jobTitle="Eng" />))
    await userEvent.click(screen.getByRole('button'))
    expect(getPdf).toHaveBeenCalledWith('d-42')
  })

  it('shows toast when getPdf throws ApiError', async () => {
    vi.mocked(getPdf).mockRejectedValue(new ApiError('Download failed', 500))
    const showToast = vi.fn()
    render(withToast(showToast, <DownloadButton draftId="d1" jobTitle="Eng" />))
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(showToast).toHaveBeenCalledWith('Download failed', 'error'))
  })

  it('shows generic toast for non-ApiError', async () => {
    vi.mocked(getPdf).mockRejectedValue(new Error('boom'))
    const showToast = vi.fn()
    render(withToast(showToast, <DownloadButton draftId="d1" jobTitle="Eng" />))
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(showToast).toHaveBeenCalledWith('Download failed, try again', 'error'))
  })

  it('disables button while downloading', async () => {
    vi.mocked(getPdf).mockReturnValue(new Promise(() => undefined))
    render(withToast(vi.fn(), <DownloadButton draftId="d1" jobTitle="Eng" />))
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveTextContent('Downloading...')
  })
})
