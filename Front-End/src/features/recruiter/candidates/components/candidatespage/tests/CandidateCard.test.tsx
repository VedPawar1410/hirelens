import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CandidateCard } from '../CandidateCard'
import type { Candidate } from '../../../../../../shared/types'

const c: Candidate = {
  id: 'c1', name: 'Alice', currentRole: 'Dev', avatarUrl: null,
  matchScore: 90, isDuplicate: false,
  appliedJob: { id: 'j1', title: 'Eng' }, applicationSource: 'Direct Upload',
  status: 'shortlisted', appliedDate: '2026-01-01',
  email: null, phone: null, linkedIn: null, gitHub: null,
  skills: null, experience: null, education: null,
}

function renderCard(overrides: Partial<Parameters<typeof CandidateCard>[0]> = {}) {
  const onView = vi.fn(); const onNextStage = vi.fn(); const onShortlist = vi.fn(); const onReject = vi.fn()
  render(<CandidateCard candidate={c} isLast={false} onView={onView} onNextStage={onNextStage} onShortlist={onShortlist} onReject={onReject} {...overrides} />)
  return { onView, onNextStage, onShortlist, onReject }
}

describe('CandidateCard', () => {
  it('renders name and role', () => {
    renderCard()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Dev')).toBeInTheDocument()
  })

  it('renders Duplicate Application chip when flagged', () => {
    renderCard({ candidate: { ...c, isDuplicate: true } })
    expect(screen.getByText('Duplicate Application')).toBeInTheDocument()
  })

  it('fires onView when the card is clicked', async () => {
    const { onView } = renderCard()
    await userEvent.click(screen.getByText('Alice'))
    expect(onView).toHaveBeenCalledWith(c)
  })

  it('Reject does not bubble onView', async () => {
    const { onView, onReject } = renderCard()
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(onReject).toHaveBeenCalledWith('c1')
    expect(onView).not.toHaveBeenCalled()
  })
})
