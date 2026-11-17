import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UploadResumeModal } from '../UploadResumeModal'

const startUpload = vi.fn()

vi.mock('../../../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1', username: 'rec1', role: 'recruitment', name: 'R' } }),
}))
vi.mock('../../../../../shared/context/UploadProgressContext', () => ({
  useUploadProgress: () => ({ startUpload }),
}))
vi.mock('../../../jd-creation/api/jdApi', () => ({
  getPublishedJDs: vi.fn().mockResolvedValue([]),
}))

function withQc(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('UploadResumeModal', () => {
  beforeEach(() => {
    startUpload.mockReset()
  })

  it('renders header and step indicator on pick-jd step', () => {
    withQc(<UploadResumeModal onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Upload Resumes' })).toBeInTheDocument()
    expect(screen.getByText('Select JD')).toBeInTheDocument()
  })

  it('jumps straight to upload step when preselectedJobId given', () => {
    withQc(<UploadResumeModal onClose={vi.fn()} preselectedJobId="j1" preselectedJobTitle="Eng" />)
    expect(screen.getByText(/Drag & drop resumes/)).toBeInTheDocument()
  })

  it('shows the preselected job title in the description', () => {
    withQc(<UploadResumeModal onClose={vi.fn()} preselectedJobId="j1" preselectedJobTitle="Engineer" />)
    expect(screen.getByText('Uploading for: Engineer')).toBeInTheDocument()
  })

  it('fires onClose on the close (X) button', async () => {
    const onClose = vi.fn()
    withQc(<UploadResumeModal onClose={onClose} preselectedJobId="j1" />)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('Skip advances from pick-jd to upload step', async () => {
    withQc(<UploadResumeModal onClose={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.getByText(/Drag & drop resumes/)).toBeInTheDocument()
  })

  it('Upload button is disabled with no files', () => {
    withQc(<UploadResumeModal onClose={vi.fn()} preselectedJobId="j1" />)
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled()
  })
})
