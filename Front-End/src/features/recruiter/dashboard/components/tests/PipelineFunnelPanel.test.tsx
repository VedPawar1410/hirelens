import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PipelineFunnelPanel from '../PipelineFunnelPanel'

vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({
    isTiny: false, isMobile: false, isCompact: false,
    isTablet: false, isCompactTablet: false, isDesktop: true,
  }),
}))

const sampleData = {
  stages: [
    { stage: 'shortlisted', label: 'Shortlisted', count: 12 },
    { stage: '1st_round', label: '1st Round', count: 6 },
  ],
  selectedRate: 8,
  avgCycleDays: 14,
}

describe('PipelineFunnelPanel', () => {
  it('renders Pipeline header', () => {
    render(<PipelineFunnelPanel data={sampleData} isLoading={false} />)
    expect(screen.getByText('Pipeline')).toBeInTheDocument()
  })

  it('renders stage labels and counts', () => {
    render(<PipelineFunnelPanel data={sampleData} isLoading={false} />)
    expect(screen.getByText('Shortlisted')).toBeInTheDocument()
    expect(screen.getByText('1st Round')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('renders selected rate footer', () => {
    render(<PipelineFunnelPanel data={sampleData} isLoading={false} />)
    expect(screen.getByText('8%')).toBeInTheDocument()
    expect(screen.getByText('14d')).toBeInTheDocument()
  })

  it('renders skeletons while loading', () => {
    const { container } = render(<PipelineFunnelPanel data={undefined} isLoading={true} />)
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBeGreaterThan(0)
  })

  it('renders "No pipeline data" when stages empty', () => {
    render(<PipelineFunnelPanel data={{ stages: [], selectedRate: 0, avgCycleDays: 0 }} isLoading={false} />)
    expect(screen.getByText('No pipeline data')).toBeInTheDocument()
  })

  it('calls onDetailsClick when Details clicked', async () => {
    const onDetailsClick = vi.fn()
    render(<PipelineFunnelPanel data={sampleData} isLoading={false} onDetailsClick={onDetailsClick} />)
    await userEvent.click(screen.getByRole('button', { name: /Details/ }))
    expect(onDetailsClick).toHaveBeenCalled()
  })
})
