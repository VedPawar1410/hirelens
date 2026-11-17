import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionSignalsBar } from '../ActionSignalsBar'

const counts = { underReview: 5, topMatches: 3 }
const upcoming = { count: 2, nextInterviewAt: '2026-05-25T10:00:00Z', nextCandidateName: 'Alice' }

describe('ActionSignalsBar', () => {
  it('renders count for under review when counts available', () => {
    render(<ActionSignalsBar countsData={counts} upcomingData={upcoming} showTopAts={false} onSetStatus={vi.fn()} onToggleTopAts={vi.fn()} onViewInterviews={vi.fn()} />)
    expect(screen.getByText('5 candidates need a decision')).toBeInTheDocument()
  })

  it('renders dashes when counts undefined', () => {
    render(<ActionSignalsBar countsData={undefined} upcomingData={undefined} showTopAts={false} onSetStatus={vi.fn()} onToggleTopAts={vi.fn()} onViewInterviews={vi.fn()} />)
    expect(screen.getByText('— candidates need a decision')).toBeInTheDocument()
    expect(screen.getByText('— AI top matches')).toBeInTheDocument()
  })

  it('shows "Clear ×" CTA when showTopAts=true', () => {
    render(<ActionSignalsBar countsData={counts} upcomingData={upcoming} showTopAts onSetStatus={vi.fn()} onToggleTopAts={vi.fn()} onViewInterviews={vi.fn()} />)
    expect(screen.getByText('Clear ×')).toBeInTheDocument()
  })

  it('shows "See picks →" when showTopAts=false', () => {
    render(<ActionSignalsBar countsData={counts} upcomingData={upcoming} showTopAts={false} onSetStatus={vi.fn()} onToggleTopAts={vi.fn()} onViewInterviews={vi.fn()} />)
    expect(screen.getByText('See picks →')).toBeInTheDocument()
  })

  it('calls onSetStatus("under_review") when first tile clicked', async () => {
    const onSetStatus = vi.fn()
    render(<ActionSignalsBar countsData={counts} upcomingData={upcoming} showTopAts={false} onSetStatus={onSetStatus} onToggleTopAts={vi.fn()} onViewInterviews={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /candidates need a decision/ }))
    expect(onSetStatus).toHaveBeenCalledWith('under_review')
  })

  it('calls onToggleTopAts when top picks tile clicked', async () => {
    const onToggleTopAts = vi.fn()
    render(<ActionSignalsBar countsData={counts} upcomingData={upcoming} showTopAts={false} onSetStatus={vi.fn()} onToggleTopAts={onToggleTopAts} onViewInterviews={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /AI top matches/ }))
    expect(onToggleTopAts).toHaveBeenCalledTimes(1)
  })

  it('calls onViewInterviews when interviews tile clicked', async () => {
    const onViewInterviews = vi.fn()
    render(<ActionSignalsBar countsData={counts} upcomingData={upcoming} showTopAts={false} onSetStatus={vi.fn()} onToggleTopAts={vi.fn()} onViewInterviews={onViewInterviews} />)
    await userEvent.click(screen.getByRole('button', { name: /Interviews in 24h/ }))
    expect(onViewInterviews).toHaveBeenCalledTimes(1)
  })

  it('renders "No interviews scheduled soon" when no nextCandidateName', () => {
    render(<ActionSignalsBar countsData={counts} upcomingData={{ count: 0 }} showTopAts={false} onSetStatus={vi.fn()} onToggleTopAts={vi.fn()} onViewInterviews={vi.fn()} />)
    expect(screen.getByText('No interviews scheduled soon')).toBeInTheDocument()
  })
})
