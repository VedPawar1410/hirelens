import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CandidateDetailPanel } from '../CandidateDetailPanel'
import type { Candidate } from '../../../../../../shared/types/index'

vi.mock('../../../../../../shared/hooks/usePdfBlobUrl', () => ({
  usePdfBlobUrl: (b: string | null) => (b ? 'blob:mock' : null),
}))

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'c1', name: 'Alice', currentRole: 'Dev', avatarUrl: null,
    matchScore: 88, isDuplicate: false,
    appliedJob: { id: 'j1', title: 'Eng' }, applicationSource: 'Direct Upload',
    status: 'shortlisted', appliedDate: '',
    email: null, phone: null, linkedIn: null, gitHub: null,
    skills: null, experience: null, education: null,
    ...overrides,
  }
}

function renderPanel(overrides: Partial<Parameters<typeof CandidateDetailPanel>[0]> = {}) {
  const props = {
    candidate: candidate(), resumeBase64: null, resumeFileName: null,
    onNextStage: vi.fn(), onPrevStage: vi.fn(), onReject: vi.fn(), onViewProfile: vi.fn(),
    isMoving: false, isMovingBack: false,
    ...overrides,
  }
  render(<CandidateDetailPanel {...props} />)
  return props
}

describe('CandidateDetailPanel', () => {
  it('renders candidate name, role, score', () => {
    renderPanel()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Dev')).toBeInTheDocument()
    expect(screen.getByText('88')).toBeInTheDocument()
  })

  it('renders "Move to ..." button for an advanceable stage', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /Move to/ })).toBeInTheDocument()
  })

  it('shows Restore button when rejected', () => {
    renderPanel({ candidate: candidate({ status: 'rejected' }) })
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument()
  })

  it('fires onNextStage', async () => {
    const onNextStage = vi.fn()
    renderPanel({ onNextStage })
    await userEvent.click(screen.getByRole('button', { name: /Move to/ }))
    expect(onNextStage).toHaveBeenCalledWith('c1')
  })

  it('fires onReject', async () => {
    const onReject = vi.fn()
    renderPanel({ onReject })
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(onReject).toHaveBeenCalledWith('c1')
  })

  it('fires onViewProfile', async () => {
    const onViewProfile = vi.fn()
    renderPanel({ onViewProfile })
    await userEvent.click(screen.getByRole('button', { name: /View full profile/ }))
    expect(onViewProfile).toHaveBeenCalled()
  })

  it('shows empty resume state when no resume', () => {
    renderPanel()
    expect(screen.getByText('No resume available')).toBeInTheDocument()
  })

  it('renders an iframe when resume present', () => {
    const { container } = render(
      <CandidateDetailPanel
        candidate={candidate()} resumeBase64="abc" resumeFileName="r.pdf"
        onNextStage={vi.fn()} onPrevStage={vi.fn()} onReject={vi.fn()} onViewProfile={vi.fn()}
        isMoving={false} isMovingBack={false}
      />,
    )
    expect(container.querySelector('iframe')).toBeTruthy()
  })
})
