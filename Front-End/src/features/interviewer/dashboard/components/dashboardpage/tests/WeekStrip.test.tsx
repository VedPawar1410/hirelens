import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WeekStrip } from '../WeekStrip'

const today = new Date(2026, 4, 25) // Monday May 25 2026
const tomorrow = new Date(2026, 4, 26)

const weekDays = [today, tomorrow].map((d, i) => ({
  date: d,
  isToday: i === 0,
  isPast: false,
  count: i === 0 ? 3 : 0,
  hasLive: false,
}))

describe('WeekStrip', () => {
  it('renders header and day numbers', () => {
    render(<WeekStrip weekDays={weekDays} activeDayStr={today.toDateString()} setSelectedDay={vi.fn()} isMobile={false} />)
    expect(screen.getByText('This Week')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('26')).toBeInTheDocument()
  })

  it('renders count badge for days with interviews', () => {
    render(<WeekStrip weekDays={weekDays} activeDayStr={today.toDateString()} setSelectedDay={vi.fn()} isMobile={false} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('clears selection when today is clicked again', async () => {
    const setSelectedDay = vi.fn()
    render(<WeekStrip weekDays={weekDays} activeDayStr={today.toDateString()} setSelectedDay={setSelectedDay} isMobile={false} />)
    await userEvent.click(screen.getByText('25'))
    expect(setSelectedDay).toHaveBeenCalledWith(null)
  })

  it('selects a non-today day when clicked', async () => {
    const setSelectedDay = vi.fn()
    render(<WeekStrip weekDays={weekDays} activeDayStr={today.toDateString()} setSelectedDay={setSelectedDay} isMobile={false} />)
    await userEvent.click(screen.getByText('26'))
    expect(setSelectedDay).toHaveBeenCalledWith(expect.any(Date))
  })
})
