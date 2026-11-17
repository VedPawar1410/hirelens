import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="draft" />)
    expect(screen.getByText('draft')).toBeInTheDocument()
  })

  it('uses grey classes for draft', () => {
    render(<StatusBadge status="draft" />)
    expect(screen.getByText('draft').className).toContain('#374151')
  })

  it('uses amber classes for assigned', () => {
    render(<StatusBadge status="assigned" />)
    expect(screen.getByText('assigned').className).toContain('#78350f')
  })

  it('uses blue classes for returned', () => {
    render(<StatusBadge status="returned" />)
    expect(screen.getByText('returned').className).toContain('#1e3a5f')
  })

  it('uses green classes for finalized', () => {
    render(<StatusBadge status="finalized" />)
    expect(screen.getByText('finalized').className).toContain('#14532d')
  })
})
