import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Briefcase } from 'lucide-react'
import { SectionLabel } from '../SectionLabel'

describe('SectionLabel', () => {
  it('renders the label text', () => {
    render(<SectionLabel icon={Briefcase} text="Jobs" />)
    expect(screen.getByText('Jobs')).toBeInTheDocument()
  })

  it('renders the provided icon component', () => {
    const Marker = () => <svg data-testid="marker" />
    render(<SectionLabel icon={Marker} text="X" />)
    expect(screen.getByTestId('marker')).toBeInTheDocument()
  })
})
