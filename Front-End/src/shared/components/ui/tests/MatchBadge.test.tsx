import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchBadge } from '../MatchBadge'

describe('MatchBadge', () => {
  it('returns null when score is null', () => {
    const { container } = render(<MatchBadge score={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders "..." with grey color for -1 (pending sentinel)', () => {
    render(<MatchBadge score={-1} />)
    expect(screen.getByText('...')).toBeInTheDocument()
    expect(screen.getByText('...')).toHaveStyle({ color: '#9ca3af' })
  })

  it('renders "Failed" with red color for other negative values', () => {
    render(<MatchBadge score={-99} />)
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toHaveStyle({ color: '#f87171' })
  })

  it('renders green badge for 80+ score with a Bot icon', () => {
    const { container } = render(<MatchBadge score={92} />)
    expect(screen.getByText('92%')).toBeInTheDocument()
    expect(screen.getByText('92%')).toHaveStyle({ color: '#22c55e' })
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
  })

  it('renders blue badge for 60..79 without a Bot icon', () => {
    const { container } = render(<MatchBadge score={70} />)
    expect(screen.getByText('70%')).toHaveStyle({ color: '#6ea8fe' })
    expect(container.querySelectorAll('svg').length).toBe(0)
  })

  it('renders grey badge for 0..59', () => {
    render(<MatchBadge score={45} />)
    expect(screen.getByText('45%')).toHaveStyle({ color: '#9ca3af' })
  })
})
