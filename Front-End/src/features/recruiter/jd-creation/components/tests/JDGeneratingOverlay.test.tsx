import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JDGeneratingOverlay } from '../JDGeneratingOverlay'

const JOB_TITLE = 'Senior Engineer'

describe('JDGeneratingOverlay', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<JDGeneratingOverlay isVisible={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders heading and subtext when visible', () => {
    render(<JDGeneratingOverlay isVisible />)
    expect(screen.getByText('Generating your JD')).toBeInTheDocument()
    expect(screen.getByText(/AI is crafting a tailored description/)).toBeInTheDocument()
  })

  it('renders job title when provided', () => {
    render(<JDGeneratingOverlay isVisible jobTitle={JOB_TITLE} />)
    expect(screen.getByText(JOB_TITLE)).toBeInTheDocument()
  })

  it('omits job title element when not provided', () => {
    render(<JDGeneratingOverlay isVisible />)
    expect(screen.queryByText(JOB_TITLE)).toBeNull()
  })
})
