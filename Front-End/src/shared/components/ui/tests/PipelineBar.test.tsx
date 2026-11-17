import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PipelineBar } from '../PipelineBar'

describe('PipelineBar', () => {
  it('renders all stage abbreviations', () => {
    render(<PipelineBar activeStageIdx={3} />)
    for (const abbr of ['Rev', 'Flt', 'Srt', 'Intv', 'Sel']) {
      expect(screen.getByText(abbr)).toBeInTheDocument()
    }
  })

  it('highlights the active label for the active index', () => {
    render(<PipelineBar activeStageIdx={3} />)
    const active = screen.getByText('Intv')
    expect(active).toHaveStyle({ color: 'rgba(255,255,255,0.8)' })
  })

  it('dims labels past the active index as muted', () => {
    render(<PipelineBar activeStageIdx={2} />)
    const future = screen.getByText('Sel')
    expect(future).toHaveStyle({ color: 'rgba(255,255,255,0.2)' })
  })

  it('renders past stages with the past-blue color', () => {
    render(<PipelineBar activeStageIdx={4} />)
    const past = screen.getByText('Srt')
    expect(past).toHaveStyle({ color: 'rgba(110,168,254,0.5)' })
  })

  it('handles activeStageIdx=-1 (no active stage) by treating all as past', () => {
    render(<PipelineBar activeStageIdx={-1} />)
    expect(screen.getByText('Rev')).toBeInTheDocument()
  })
})
