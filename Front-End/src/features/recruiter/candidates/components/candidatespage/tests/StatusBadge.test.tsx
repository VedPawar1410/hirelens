import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'

describe('StatusBadge (candidatespage)', () => {
  it('renders the human label for shortlisted', () => {
    render(<StatusBadge status="shortlisted" />)
    expect(screen.getByText('Shortlisted')).toBeInTheDocument()
  })

  it('renders the human label for under_review', () => {
    render(<StatusBadge status="under_review" />)
    expect(screen.getByText('Under Review')).toBeInTheDocument()
  })

  it('renders the human label for rejected', () => {
    render(<StatusBadge status="rejected" />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })

  it('uses compact spacing when compact=true', () => {
    render(<StatusBadge status="filtered" compact />)
    expect(screen.getByText('Filtered').className).toContain('text-[11px]')
  })
})
