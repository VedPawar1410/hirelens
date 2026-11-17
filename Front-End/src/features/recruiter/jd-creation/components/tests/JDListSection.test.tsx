import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JDListSection } from '../JDListSection'

vi.mock('../JDListPanel', () => ({
  JDListPanel: () => <div data-testid="jd-list-panel">JDListPanel</div>,
}))

const defaultProps = {
  drafts: [], isLoading: false, copiedIds: new Set<string>(),
  generatingDraftId: null, isDeleting: false,
  onCopy: vi.fn(), onEditFinalized: vi.fn(),
  onRetryGenerate: vi.fn(), onDelete: vi.fn(),
}

describe('JDListSection', () => {
  it('renders JDListPanel directly on desktop', () => {
    render(<JDListSection {...defaultProps} isMobile={false} showJdList onToggleList={vi.fn()} />)
    expect(screen.getByTestId('jd-list-panel')).toBeInTheDocument()
  })

  it('renders toggle button only on mobile when list hidden', () => {
    render(<JDListSection {...defaultProps} isMobile showJdList={false} onToggleList={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Show All JDs/ })).toBeInTheDocument()
    expect(screen.queryByTestId('jd-list-panel')).toBeNull()
  })

  it('renders toggle + list when expanded on mobile', () => {
    render(<JDListSection {...defaultProps} isMobile showJdList onToggleList={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Show All JDs/ })).toBeInTheDocument()
    expect(screen.getByTestId('jd-list-panel')).toBeInTheDocument()
  })

  it('toggle button fires onToggleList', async () => {
    const onToggleList = vi.fn()
    render(<JDListSection {...defaultProps} isMobile showJdList={false} onToggleList={onToggleList} />)
    await userEvent.click(screen.getByRole('button', { name: /Show All JDs/ }))
    expect(onToggleList).toHaveBeenCalled()
  })

  it('shows draft count in toggle label', () => {
    render(<JDListSection {...defaultProps} drafts={[{ id: 'd1' } as never, { id: 'd2' } as never]} isMobile showJdList={false} onToggleList={vi.fn()} />)
    expect(screen.getByText('Show All JDs (2)')).toBeInTheDocument()
  })
})
