import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AssignInterviewerPanel } from '../AssignInterviewerPanel'

vi.mock('../../../../../shared/api/authApi', async () => {
  const actual = await vi.importActual<typeof import('../../../../../shared/api/authApi')>('../../../../../shared/api/authApi')
  return {
    ...actual,
    getInterviewers: vi.fn(),
  }
})

import { getInterviewers } from '../../../../../shared/api/authApi'

function withQc(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const interviewers = [
  { id: '1', username: 'iv1', fullName: 'Eve One', email: 'eve@x.com' },
  { id: '2', username: 'iv2', fullName: 'Bob Two', email: 'bob@x.com' },
]

describe('AssignInterviewerPanel', () => {
  beforeEach(() => {
    vi.mocked(getInterviewers).mockResolvedValue(interviewers)
  })

  it('renders the trigger with "Select Interviewers" when empty', () => {
    withQc(<AssignInterviewerPanel assignedTo={[]} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Select Interviewers/ })).toBeInTheDocument()
  })

  it('renders "N Assigned" when assignments present', () => {
    withQc(<AssignInterviewerPanel assignedTo={['iv1', 'iv2']} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /2 Assigned/ })).toBeInTheDocument()
  })

  it('renders assigned username chips', () => {
    withQc(<AssignInterviewerPanel assignedTo={['iv1']} onChange={vi.fn()} />)
    expect(screen.getByText('iv1')).toBeInTheDocument()
  })

  it('opens dropdown and lists interviewers on click', async () => {
    withQc(<AssignInterviewerPanel assignedTo={[]} onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Select Interviewers/ }))
    await waitFor(() => expect(screen.getByText('Eve One')).toBeInTheDocument())
    expect(screen.getByText('Bob Two')).toBeInTheDocument()
  })

  it('checking + confirm calls onChange with selected usernames', async () => {
    const onChange = vi.fn()
    withQc(<AssignInterviewerPanel assignedTo={[]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /Select Interviewers/ }))
    await waitFor(() => screen.getByText('Eve One'))
    await userEvent.click(screen.getByLabelText('Eve One'))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onChange).toHaveBeenCalledWith(['iv1'])
  })

  it('cancel closes dropdown without emitting onChange', async () => {
    const onChange = vi.fn()
    withQc(<AssignInterviewerPanel assignedTo={[]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /Select Interviewers/ }))
    await waitFor(() => screen.getByText('Eve One'))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
