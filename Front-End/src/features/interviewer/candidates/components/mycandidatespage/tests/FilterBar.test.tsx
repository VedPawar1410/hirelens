import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterChip, ScheduleViewButton, StartWithOldestButton } from '../FilterBar'

describe('FilterChip', () => {
  it('renders label and count', () => {
    render(<FilterChip label="All" count={7} active={false} onClick={vi.fn()} />)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('hides count badge when 0', () => {
    render(<FilterChip label="All" count={0} active={false} onClick={vi.fn()} />)
    expect(screen.queryByText('0')).toBeNull()
  })

  it('fires onClick', async () => {
    const onClick = vi.fn()
    render(<FilterChip label="X" count={1} active={false} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })

  it('uses active styling when active', () => {
    render(<FilterChip label="X" count={1} active onClick={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveStyle({ color: '#c4b5fd' })
  })
})

describe('ScheduleViewButton', () => {
  it('renders "Schedule view"', () => {
    render(<ScheduleViewButton onClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Schedule view/ })).toBeInTheDocument()
  })

  it('fires onClick', async () => {
    const onClick = vi.fn()
    render(<ScheduleViewButton onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})

describe('StartWithOldestButton', () => {
  it('renders label and fires onClick', async () => {
    const onClick = vi.fn()
    render(<StartWithOldestButton onClick={onClick} />)
    await userEvent.click(screen.getByRole('button', { name: /Start with oldest/ }))
    expect(onClick).toHaveBeenCalled()
  })
})
