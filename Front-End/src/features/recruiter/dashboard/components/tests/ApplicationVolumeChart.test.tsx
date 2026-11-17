import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ApplicationVolumeChart from '../ApplicationVolumeChart'

vi.mock('../../../../../shared/hooks/useBreakpoints', () => ({
  useBreakpoints: () => ({
    isTiny: false, isMobile: false, isCompact: false,
    isTablet: false, isCompactTablet: false, isDesktop: true,
  }),
}))

describe('ApplicationVolumeChart', () => {
  it('renders header and total apps', () => {
    render(<ApplicationVolumeChart data={[{ day: 'Mon', apps: 5 }, { day: 'Tue', apps: 3 }]} isLoading={false} period="7d" onPeriodChange={vi.fn()} />)
    expect(screen.getByText('Application Volume')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('renders 0 when no data', () => {
    render(<ApplicationVolumeChart data={[]} isLoading={false} period="7d" onPeriodChange={vi.fn()} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('No data for this period.')).toBeInTheDocument()
  })

  it('shows skeleton while loading', () => {
    const { container } = render(<ApplicationVolumeChart data={[]} isLoading period="7d" onPeriodChange={vi.fn()} />)
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBeGreaterThan(0)
  })

  it('emits onPeriodChange when 30D pressed', async () => {
    const onPeriodChange = vi.fn()
    render(<ApplicationVolumeChart data={[{ day: 'Mon', apps: 1 }]} isLoading={false} period="7d" onPeriodChange={onPeriodChange} />)
    await userEvent.click(screen.getByRole('button', { name: '30D' }))
    expect(onPeriodChange).toHaveBeenCalledWith('30d')
  })

  it('renders all 3 period buttons', () => {
    render(<ApplicationVolumeChart data={[]} isLoading={false} period="7d" onPeriodChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: '7D' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '30D' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '90D' })).toBeInTheDocument()
  })
})
