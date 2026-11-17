import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CandidateRow } from '../CandidateRow'
import type { Candidate } from '../../../../../../shared/types'

const c: Candidate = {
  id: 'c1', name: 'Alice', currentRole: 'Dev', avatarUrl: null,
  matchScore: 90, isDuplicate: false,
  appliedJob: { id: 'j1', title: 'Eng' }, applicationSource: 'Direct Upload',
  status: 'shortlisted', appliedDate: '2026-01-01',
  email: null, phone: null, linkedIn: null, gitHub: null,
  skills: null, experience: null, education: null,
}

function renderRow(overrides: Partial<Parameters<typeof CandidateRow>[0]> = {}) {
  const onView = vi.fn()
  const onNextStage = vi.fn()
  const onShortlist = vi.fn()
  const onReject = vi.fn()
  render(
    <table><tbody>
      <CandidateRow
        candidate={c} isLast={false} isTablet={false}
        onNextStage={onNextStage} onShortlist={onShortlist}
        onReject={onReject} onView={onView}
        {...overrides}
      />
    </tbody></table>,
  )
  return { onView, onNextStage, onShortlist, onReject }
}

describe('CandidateRow', () => {
  it('renders name and role', () => {
    renderRow()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Dev')).toBeInTheDocument()
  })

  it('renders job title from appliedJob', () => {
    renderRow()
    expect(screen.getByText('Eng')).toBeInTheDocument()
  })

  it('renders em dash when no appliedJob', () => {
    renderRow({ candidate: { ...c, appliedJob: null } })
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows Duplicate Application chip when flagged', () => {
    renderRow({ candidate: { ...c, isDuplicate: true } })
    expect(screen.getByText('Duplicate Application')).toBeInTheDocument()
  })

  it('hides applicationSource and appliedDate when isTablet=true', () => {
    renderRow({ isTablet: true })
    expect(screen.queryByText('Direct Upload')).toBeNull()
    expect(screen.queryByText('2026-01-01')).toBeNull()
  })

  it('fires onView when row is clicked', async () => {
    const { onView } = renderRow()
    await userEvent.click(screen.getByText('Alice'))
    expect(onView).toHaveBeenCalledWith(c)
  })

  it('Reject button does not bubble onView', async () => {
    const { onView, onReject } = renderRow()
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(onReject).toHaveBeenCalledWith('c1')
    expect(onView).not.toHaveBeenCalled()
  })
})
