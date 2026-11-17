import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StageRail } from '../StageRail'

const counts = {
  under_review: 4, filtered: 2, shortlisted: 3,
  '1st_round': 1, '2nd_round': 0, '3rd_round': 0,
  '4th_round': 0, '5th_round': 0, selected: 0, rejected: 2,
}

describe('StageRail', () => {
  it('renders all pipeline stages including Rejected', () => {
    render(<StageRail selectedStage="shortlisted" onSelectStage={vi.fn()} stageCounts={counts} isLoading={false} />)
    expect(screen.getByText('Under Review')).toBeInTheDocument()
    expect(screen.getByText('Shortlisted')).toBeInTheDocument()
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })

  it('renders counts when not loading', () => {
    render(<StageRail selectedStage="shortlisted" onSelectStage={vi.fn()} stageCounts={counts} isLoading={false} />)
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders dashes for counts when loading', () => {
    render(<StageRail selectedStage="shortlisted" onSelectStage={vi.fn()} stageCounts={{}} isLoading />)
    expect(screen.getAllByText('–').length).toBeGreaterThan(0)
  })

  it('renders total in pipeline (excludes rejected)', () => {
    render(<StageRail selectedStage="shortlisted" onSelectStage={vi.fn()} stageCounts={counts} isLoading={false} />)
    expect(screen.getByText('10')).toBeInTheDocument() // 4+2+3+1
  })

  it('calls onSelectStage when a stage clicked', async () => {
    const onSelectStage = vi.fn()
    render(<StageRail selectedStage="shortlisted" onSelectStage={onSelectStage} stageCounts={counts} isLoading={false} />)
    await userEvent.click(screen.getByText('Under Review'))
    expect(onSelectStage).toHaveBeenCalledWith('under_review')
  })

  it('calls onSelectStage("rejected") when Rejected clicked', async () => {
    const onSelectStage = vi.fn()
    render(<StageRail selectedStage="shortlisted" onSelectStage={onSelectStage} stageCounts={counts} isLoading={false} />)
    await userEvent.click(screen.getByText('Rejected'))
    expect(onSelectStage).toHaveBeenCalledWith('rejected')
  })
})
