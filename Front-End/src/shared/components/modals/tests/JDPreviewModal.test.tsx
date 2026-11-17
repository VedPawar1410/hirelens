import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { JDPreviewModal } from '../JDPreviewModal'
import { ToastContext } from '../../Toast/ToastProvider'
import { ApiError } from '../../../types/api'
import type { JDDraft } from '../../../types/index'

vi.mock('../../../../features/recruiter/jd-creation/api/jdApi', () => ({
  finalizeDraft: vi.fn(),
}))

import { finalizeDraft } from '../../../../features/recruiter/jd-creation/api/jdApi'

const draft: JDDraft = {
  id: 'd1',
  experienceLevel: 'experienced',
  jobTitle: 'Eng',
  location: 'Remote',
  workMode: 'Hybrid',
  workHours: '40',
  duration: 'Full-time',
  stipendSalary: '',
  fulltimeOfferSalary: '120k',
  yearsOfExperience: '3-5',
  noticePeriod: '',
  relevantExperience: '',
  roleDescription: '',
  generatedJd: '',
  assignedTo: [],
  interviewRounds: [],
  status: 'returned',
  createdBy: 'alice',
  createdAt: '2026-01-01',
}

function renderModal(props: Partial<Parameters<typeof JDPreviewModal>[0]> = {}, showToast = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = (ui: ReactNode) => (
    <QueryClientProvider client={qc}>
      <ToastContext.Provider value={{ showToast }}>{ui}</ToastContext.Provider>
    </QueryClientProvider>
  )
  return {
    showToast,
    ...render(
      wrapper(
        <JDPreviewModal
          draftId="d1"
          previewJD={'Heading\n\n- bullet one\nlabel: value\nplain paragraph'}
          draft={draft}
          queryKey={['drafts']}
          onClose={props.onClose ?? vi.fn()}
          {...props}
        />,
      ),
    ),
  }
}

describe('JDPreviewModal', () => {
  beforeEach(() => {
    vi.mocked(finalizeDraft).mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders the title "JD Preview"', () => {
    renderModal()
    expect(screen.getByText('JD Preview')).toBeInTheDocument()
  })

  it('renders preview text (heading, bullet, label row, paragraph)', () => {
    renderModal()
    expect(screen.getByText('Heading')).toBeInTheDocument()
    expect(screen.getByText('bullet one')).toBeInTheDocument()
    expect(screen.getByText('label')).toBeInTheDocument()
    expect(screen.getByText('value')).toBeInTheDocument()
    expect(screen.getByText('plain paragraph')).toBeInTheDocument()
  })

  it('toggles between preview and edit modes', async () => {
    renderModal()
    expect(screen.queryByRole('textbox')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /Edit/ }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('copies the JD text to clipboard on Copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    renderModal()
    await userEvent.click(screen.getByRole('button', { name: /Copy/ }))
    expect(writeText).toHaveBeenCalled()
  })

  it('calls finalizeDraft on Approve & Finalize and closes on success', async () => {
    vi.mocked(finalizeDraft).mockResolvedValue(draft)
    const onClose = vi.fn()
    const { showToast } = renderModal({ onClose })
    await userEvent.click(screen.getByRole('button', { name: /Approve & Finalize/ }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(finalizeDraft).toHaveBeenCalledWith('d1', expect.objectContaining({ jobTitle: 'Eng' }))
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/finalized/i), 'success')
  })

  it('shows toast error when finalize fails', async () => {
    vi.mocked(finalizeDraft).mockRejectedValue(new ApiError('Boom', 500))
    const { showToast } = renderModal()
    await userEvent.click(screen.getByRole('button', { name: /Approve & Finalize/ }))
    await waitFor(() => expect(showToast).toHaveBeenCalledWith('Boom', 'error'))
  })

  it('fires onClose on close button click', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    const closeBtn = document.querySelector('button.bg-transparent.border-none') as HTMLButtonElement
    await userEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })
})
