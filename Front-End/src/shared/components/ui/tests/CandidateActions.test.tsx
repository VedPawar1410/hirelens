import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CandidateActions } from '../CandidateActions'

function noop() { return undefined }

const SHORTLIST = 'Shortlist'

describe('CandidateActions', () => {
  it('renders "Hired" chip for selected status without action buttons', () => {
    render(<CandidateActions status="selected" onNextStage={noop} onShortlist={noop} onReject={noop} />)
    expect(screen.getByText('Hired')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders "Rejected" chip for rejected status without action buttons', () => {
    render(<CandidateActions status="rejected" onNextStage={noop} onShortlist={noop} onReject={noop} />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows "Shortlist" CTA for under_review', () => {
    render(<CandidateActions status="under_review" onNextStage={noop} onShortlist={noop} onReject={noop} />)
    expect(screen.getByRole('button', { name: SHORTLIST })).toBeInTheDocument()
  })

  it('shows "Shortlist" CTA for filtered', () => {
    render(<CandidateActions status="filtered" onNextStage={noop} onShortlist={noop} onReject={noop} />)
    expect(screen.getByRole('button', { name: SHORTLIST })).toBeInTheDocument()
  })

  it('shows next-stage label "Move to Interview" for shortlisted', () => {
    render(<CandidateActions status="shortlisted" onNextStage={noop} onShortlist={noop} onReject={noop} />)
    expect(screen.getByRole('button', { name: 'Move to Interview' })).toBeInTheDocument()
  })

  it('shows "Select" for interviewing', () => {
    render(<CandidateActions status="interviewing" onNextStage={noop} onShortlist={noop} onReject={noop} />)
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument()
  })

  it('always shows Reject button (with permanent reject tooltip in DOM) when actionable', () => {
    render(<CandidateActions status="shortlisted" onNextStage={noop} onShortlist={noop} onReject={noop} />)
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
    expect(screen.getByText('Permanently reject this candidate')).toBeInTheDocument()
  })

  it('calls onShortlist on shortlist click', async () => {
    const onShortlist = vi.fn()
    render(<CandidateActions status="under_review" onNextStage={noop} onShortlist={onShortlist} onReject={noop} />)
    await userEvent.click(screen.getByRole('button', { name: SHORTLIST }))
    expect(onShortlist).toHaveBeenCalledTimes(1)
  })

  it('calls onNextStage on next-stage click', async () => {
    const onNextStage = vi.fn()
    render(<CandidateActions status="interviewing" onNextStage={onNextStage} onShortlist={noop} onReject={noop} />)
    await userEvent.click(screen.getByRole('button', { name: 'Select' }))
    expect(onNextStage).toHaveBeenCalledTimes(1)
  })

  it('calls onReject on reject click', async () => {
    const onReject = vi.fn()
    render(<CandidateActions status="shortlisted" onNextStage={noop} onShortlist={noop} onReject={onReject} />)
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(onReject).toHaveBeenCalledTimes(1)
  })
})
