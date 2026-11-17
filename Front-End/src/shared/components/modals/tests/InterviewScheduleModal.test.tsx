import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { InterviewScheduleModal } from '../InterviewScheduleModal'
import { ToastContext } from '../../Toast/ToastProvider'

vi.mock('../../../../features/recruiter/candidates/api/interviewsApi', () => ({
  scheduleRound: vi.fn(),
  getInterviewsByCandidate: vi.fn(),
}))
vi.mock('../../../../features/recruiter/jd-creation/api/jdApi', () => ({
  getDraftById: vi.fn(),
}))
vi.mock('../../../api/authApi', () => ({
  getInterviewers: vi.fn(),
  INTERVIEWERS_QUERY_KEY: ['interviewers'],
}))

import { scheduleRound, getInterviewsByCandidate } from '../../../../features/recruiter/candidates/api/interviewsApi'
import { getDraftById } from '../../../../features/recruiter/jd-creation/api/jdApi'
import { getInterviewers } from '../../../api/authApi'

// Scheduling rejects past dates, so tests must use a future value.
function futureDatetimeLocal(): string {
  const d = new Date(Date.now() + 86_400_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const mockInterviewers = [
  { id: 'iv1', username: 'jsmith', fullName: 'John Smith', email: 'j@test.com' },
]

const mockRounds = [
  { order: 1, name: 'Tech Round 1', type: 'Technical' },
  { order: 2, name: 'Managerial', type: 'Managerial' },
]

// These tests never inspect the resolved values, only that the mocks are called
// with the right args — so cast minimal stubs to the real return types.
const okScheduleResponse = { message: 'ok', data: {}, interview: {} } as unknown as Awaited<ReturnType<typeof scheduleRound>>
const draftWithRounds = { interviewRounds: mockRounds } as Awaited<ReturnType<typeof getDraftById>>

function renderModal(
  props: Partial<Parameters<typeof InterviewScheduleModal>[0]> = {},
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
      <InterviewScheduleModal
        candidateId="c1"
        jobId="j1"
        candidateName="Alice Smith"
        resumeBase64={null}
        jdBase64={null}
        onSuccess={props.onSuccess ?? vi.fn()}
        onClose={props.onClose ?? vi.fn()}
        {...props}
      />,
      { wrapper },
    ),
  }
}

async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText(/Date & Time/i), futureDatetimeLocal())
  await waitFor(() =>
    expect(screen.getByRole('option', { name: /John Smith/ })).toBeInTheDocument(),
  )
  await userEvent.selectOptions(screen.getByLabelText(/Interviewer/i), 'iv1')
  // Round defaults to the first available round once config loads.
  await waitFor(() =>
    expect(screen.getByRole('option', { name: /Tech Round 1/ })).toBeInTheDocument(),
  )
}

describe('InterviewScheduleModal', () => {
  beforeEach(() => {
    vi.mocked(scheduleRound).mockReset()
    vi.mocked(getInterviewers).mockResolvedValue(mockInterviewers)
    vi.mocked(getInterviewsByCandidate).mockResolvedValue([])
    vi.mocked(getDraftById).mockResolvedValue(draftWithRounds)
  })

  it('renders the heading with the candidate name', () => {
    renderModal()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Alice Smith')
  })

  it('defaults to the first configured round', async () => {
    renderModal()
    await waitFor(() => expect(screen.getByRole('option', { name: /Tech Round 1/ })).toBeInTheDocument())
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows validation error and does not submit when date is missing', async () => {
    renderModal()
    await userEvent.click(screen.getByRole('button', { name: /Schedule & Notify/ }))
    expect(screen.getByText(/date.*time.*required/i)).toBeInTheDocument()
    expect(scheduleRound).not.toHaveBeenCalled()
  })

  it('shows validation error and does not submit when interviewer is missing', async () => {
    renderModal()
    await userEvent.type(screen.getByLabelText(/Date & Time/i), futureDatetimeLocal())
    await userEvent.click(screen.getByRole('button', { name: /Schedule & Notify/ }))
    expect(screen.getByText(/select an interviewer/i)).toBeInTheDocument()
    expect(scheduleRound).not.toHaveBeenCalled()
  })

  it('shows validation error and does not submit when date is in the past', async () => {
    renderModal()
    await userEvent.type(screen.getByLabelText(/Date & Time/i), '2020-01-01T10:00')
    await userEvent.click(screen.getByRole('button', { name: /Schedule & Notify/ }))
    expect(screen.getByText(/future date and time/i)).toBeInTheDocument()
    expect(scheduleRound).not.toHaveBeenCalled()
  })

  it('calls scheduleRound with round name and type from the job config', async () => {
    vi.mocked(scheduleRound).mockResolvedValue(okScheduleResponse)
    renderModal()
    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: /Schedule & Notify/ }))
    await waitFor(() => expect(scheduleRound).toHaveBeenCalled())
    expect(scheduleRound).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: 'c1',
        jobId: 'j1',
        interviewerId: 'iv1',
        interviewRound: 1,
        roundName: 'Tech Round 1',
        interviewType: 'Technical',
        resumeBase64: null,
        jdBase64: null,
      }),
      expect.anything(),
    )
  })

  it('calls onSuccess and shows success toast on schedule', async () => {
    vi.mocked(scheduleRound).mockResolvedValue(okScheduleResponse)
    const onSuccess = vi.fn()
    const showToast = vi.fn()
    renderModal({ onSuccess }, showToast)
    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: /Schedule & Notify/ }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/scheduled/i), 'success')
  })

  it('shows error toast when scheduleRound fails', async () => {
    vi.mocked(scheduleRound).mockRejectedValue(new Error('server error'))
    const showToast = vi.fn()
    renderModal({}, showToast)
    await fillRequiredFields()
    await userEvent.click(screen.getByRole('button', { name: /Schedule & Notify/ }))
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/failed/i), 'error'),
    )
  })
})
