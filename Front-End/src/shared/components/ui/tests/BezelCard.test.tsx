import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BezelCard, SectionTitle } from '../BezelCard'

describe('BezelCard', () => {
  it('renders children', () => {
    render(<BezelCard><span>inside</span></BezelCard>)
    expect(screen.getByText('inside')).toBeInTheDocument()
  })

  it('appends custom className to outer bezel', () => {
    const { container } = render(<BezelCard className="custom-x">x</BezelCard>)
    expect(container.firstChild).toHaveClass('custom-x')
  })
})

describe('SectionTitle', () => {
  it('renders the title text uppercased via CSS', () => {
    render(<SectionTitle>Quick stats</SectionTitle>)
    expect(screen.getByText('Quick stats')).toBeInTheDocument()
  })
})
