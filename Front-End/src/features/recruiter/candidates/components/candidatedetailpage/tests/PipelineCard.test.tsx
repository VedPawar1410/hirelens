import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PipelineCard } from '../PipelineCard'

const badge = { label: 'Shortlisted', color: '#a78bfa', bg: 'rgba(0,0,0,0.5)' }

function renderCard(overrides = {}) {
  const props = {
    currentStatus: 'shortlisted' as const,
    badge,
    actionError: null,
    isActionPending: false,
    canGoBack: true,
    isPrevPending: false,
    isNextPending: false,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onReject: vi.fn(),
    ...overrides,
  }
  render(<PipelineCard {...props} />)
  return props
}

describe('PipelineCard', () => {
  it('renders badge label and section title', () => {
    renderCard()
    expect(screen.getByText('Pipeline Position')).toBeInTheDocument()
    expect(screen.getByText('Shortlisted')).toBeInTheDocument()
  })

  it('renders Prev button when canGoBack', () => {
    renderCard({ canGoBack: true })
    expect(screen.getByRole('button', { name: '← Prev' })).toBeInTheDocument()
  })

  it('hides Prev button when !canGoBack', () => {
    renderCard({ canGoBack: false })
    expect(screen.queryByRole('button', { name: '← Prev' })).toBeNull()
  })

  it('always renders Next Stage button', () => {
    renderCard()
    expect(screen.getByRole('button', { name: 'Next Stage →' })).toBeInTheDocument()
  })

  it('disables Next when currentStatus="selected"', () => {
    renderCard({ currentStatus: 'selected' })
    expect(screen.getByRole('button', { name: 'Next Stage →' })).toBeDisabled()
  })

  it('disables Reject when currentStatus="rejected"', () => {
    renderCard({ currentStatus: 'rejected' })
    expect(screen.getByRole('button', { name: /Reject candidate/ })).toBeDisabled()
  })

  it('fires onNext when Next clicked', async () => {
    const props = renderCard()
    await userEvent.click(screen.getByRole('button', { name: 'Next Stage →' }))
    expect(props.onNext).toHaveBeenCalled()
  })

  it('fires onPrev when Prev clicked', async () => {
    const props = renderCard()
    await userEvent.click(screen.getByRole('button', { name: '← Prev' }))
    expect(props.onPrev).toHaveBeenCalled()
  })

  it('fires onReject when Reject clicked', async () => {
    const props = renderCard()
    await userEvent.click(screen.getByRole('button', { name: /Reject candidate/ }))
    expect(props.onReject).toHaveBeenCalled()
  })

  it('renders actionError message when provided', () => {
    renderCard({ actionError: 'Cannot advance' })
    expect(screen.getByText('Cannot advance')).toBeInTheDocument()
  })

  it('shows "…" instead of labels while pending', () => {
    renderCard({ isPrevPending: true, isNextPending: true })
    expect(screen.getAllByText('…')).toHaveLength(2)
  })
})
