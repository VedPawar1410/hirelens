import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreBadge, SourceBadge } from '../ScoreBadge'

describe('ScoreBadge', () => {
  it('renders em dash when score is null and not computing', () => {
    render(<ScoreBadge score={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders ellipsis when score is null and computing', () => {
    render(<ScoreBadge score={null} isComputing />)
    expect(screen.getByText('…')).toBeInTheDocument()
  })

  it('renders green badge for 80+ score', () => {
    render(<ScoreBadge score={85} />)
    const el = screen.getByText('85')
    expect(el).toHaveStyle({ color: '#34d385' })
  })

  it('renders amber badge for 50..79 score', () => {
    render(<ScoreBadge score={65} />)
    expect(screen.getByText('65')).toHaveStyle({ color: '#fbbf24' })
  })

  it('renders red badge for <50 score', () => {
    render(<ScoreBadge score={20} />)
    expect(screen.getByText('20')).toHaveStyle({ color: '#f87171' })
  })
})

describe('SourceBadge', () => {
  it('renders LinkedIn label when source contains "LinkedIn"', () => {
    render(<SourceBadge source="LinkedIn API" />)
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toHaveStyle({ color: '#60a5fa' })
  })

  it('renders Direct Upload otherwise', () => {
    render(<SourceBadge source="anything else" />)
    expect(screen.getByText('Direct Upload')).toBeInTheDocument()
  })
})
