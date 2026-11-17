import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NeedsAttentionPanel from '../NeedsAttentionPanel'

vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({
    isTiny: false, isMobile: false, isCompact: false,
    isTablet: false, isCompactTablet: false, isDesktop: true,
  }),
}))

describe('NeedsAttentionPanel', () => {
  it('renders the panel header', () => {
    render(<NeedsAttentionPanel items={[]} isLoading={false} />)
    expect(screen.getByText('Needs Your Attention')).toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    render(<NeedsAttentionPanel items={[]} isLoading={false} />)
    expect(screen.getByText('All clear — no actions needed')).toBeInTheDocument()
  })

  it('renders skeleton rows while loading', () => {
    const { container } = render(<NeedsAttentionPanel items={[]} isLoading />)
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBeGreaterThan(0)
  })

  it('renders item title and subtitle', () => {
    const items = [
      { type: 'pending_review', count: 5, title: '5 awaiting review', subtitle: 'queue', actionPath: '/x' },
    ]
    render(<NeedsAttentionPanel items={items} isLoading={false} />)
    expect(screen.getByText('5 awaiting review')).toBeInTheDocument()
    expect(screen.getByText('queue')).toBeInTheDocument()
  })

  it('fires onReview when Review button clicked', async () => {
    const onReview = vi.fn()
    const item = { type: 'ai_matches', count: 3, title: 'AI matches', actionPath: '/x' }
    render(<NeedsAttentionPanel items={[item]} isLoading={false} onReview={onReview} />)
    await userEvent.click(screen.getByRole('button', { name: /Review/ }))
    expect(onReview).toHaveBeenCalledWith(item)
  })

  it('uses fallback icon for unknown type', () => {
    render(<NeedsAttentionPanel items={[{ type: 'mystery', count: 1, title: 'X', actionPath: '/' }]} isLoading={false} />)
    expect(screen.getByText('X')).toBeInTheDocument()
  })
})
