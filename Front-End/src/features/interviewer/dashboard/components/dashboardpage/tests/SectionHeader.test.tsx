import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionHeader } from '../SectionHeader'

describe('SectionHeader', () => {
  it('renders the label', () => {
    render(<SectionHeader label="Today" />)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('omits count when not provided', () => {
    render(<SectionHeader label="Today" />)
    expect(screen.queryByText('5')).toBeNull()
  })

  it('renders count when provided', () => {
    render(<SectionHeader label="Today" count={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders count=0 (falsy but provided)', () => {
    render(<SectionHeader label="Today" count={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('uses custom color when provided', () => {
    render(<SectionHeader label="Past" color="#ff0000" />)
    expect(screen.getByText('Past')).toHaveStyle({ color: '#ff0000' })
  })
})
