import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AtsBadge } from '../AtsBadge'

describe('AtsBadge', () => {
  it('renders nothing for an unscored candidate', () => {
    const { container } = render(<AtsBadge score={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a real score as a percentage', () => {
    render(<AtsBadge score={88} />)
    expect(screen.getByText('88% ATS')).toBeInTheDocument()
  })

  it.each([
    [-1, 'Scoring...'],
    [-2, 'ATS: Failed'],
    [-3, 'ATS: Review'],
  ])('renders sentinel %i as a state, never as a negative percentage', (score, label) => {
    render(<AtsBadge score={score} />)
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.queryByText(/-\d+% ATS/)).not.toBeInTheDocument()
  })
})
