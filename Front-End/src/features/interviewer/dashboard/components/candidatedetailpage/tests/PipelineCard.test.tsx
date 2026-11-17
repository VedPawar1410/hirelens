import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PipelineCard } from '../PipelineCard'

describe('PipelineCard (interviewer)', () => {
  it('renders title', () => {
    render(<PipelineCard activeStageIdx={2} />)
    expect(screen.getByText('Pipeline Position')).toBeInTheDocument()
  })

  it('renders the badge label for active stage', () => {
    render(<PipelineCard activeStageIdx={2} />)
    expect(screen.getByText('Shortlisted')).toBeInTheDocument()
  })

  it('omits badge when activeStageIdx out of range', () => {
    render(<PipelineCard activeStageIdx={-1} />)
    expect(screen.queryByText('Shortlisted')).toBeNull()
  })
})
