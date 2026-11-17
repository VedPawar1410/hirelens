import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CandidateSelectionModal } from '../CandidateSelectionModal'
import { ToastContext } from '../../Toast/ToastProvider'

vi.mock('../../../../features/recruiter/candidates/api/candidatesApi', () => ({
  selectWithNotify: vi.fn(),
}))

import { selectWithNotify } from '../../../../features/recruiter/candidates/api/candidatesApi'

function renderModal(
  props: Partial<Parameters<typeof CandidateSelectionModal>[0]> = {},
  showToast = vi.fn(),
) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <ToastContext.Provider value={{ showToast }}>{children}</ToastContext.Provider>
    </QueryClientProvider>
  )
  return {
    showToast,
    ...render(
      <CandidateSelectionModal
        candidateId="c1"
        jobId="j1"
        candidateName="Jane Doe"
        onSuccess={props.onSuccess ?? vi.fn()}
        onClose={props.onClose ?? vi.fn()}
        {...props}
      />,
      { wrapper },
    ),
  }
}

describe('CandidateSelectionModal', () => {
  beforeEach(() => {
    vi.mocked(selectWithNotify).mockReset()
  })

  it('renders the confirm title', () => {
    renderModal()
    expect(screen.getByRole('heading', { name: 'Confirm Selection' })).toBeInTheDocument()
  })

  it('displays the candidate name in the description', () => {
    renderModal()
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls selectWithNotify with correct candidateId and jobId', async () => {
    vi.mocked(selectWithNotify).mockResolvedValue({ status: 'selected' })
    renderModal()
    await userEvent.click(screen.getByRole('button', { name: /Confirm & Notify/ }))
    expect(selectWithNotify).toHaveBeenCalledWith('c1', 'j1')
  })

  it('calls onSuccess and shows success toast on confirm', async () => {
    vi.mocked(selectWithNotify).mockResolvedValue({ status: 'selected' })
    const onSuccess = vi.fn()
    const showToast = vi.fn()
    renderModal({ onSuccess }, showToast)
    await userEvent.click(screen.getByRole('button', { name: /Confirm & Notify/ }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/Jane Doe/), 'success')
  })

  it('shows error toast when selectWithNotify fails', async () => {
    vi.mocked(selectWithNotify).mockRejectedValue(new Error('network'))
    const showToast = vi.fn()
    renderModal({}, showToast)
    await userEvent.click(screen.getByRole('button', { name: /Confirm & Notify/ }))
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/failed/i), 'error'),
    )
  })

  it('shows inline error message when mutation fails', async () => {
    vi.mocked(selectWithNotify).mockRejectedValue(new Error('network'))
    renderModal()
    await userEvent.click(screen.getByRole('button', { name: /Confirm & Notify/ }))
    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument(),
    )
  })
})
