import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileControls } from '../MobileControls'

describe('MobileControls', () => {
  it('renders search input and All chip', () => {
    render(<MobileControls search="" onSearchChange={vi.fn()} activeStatus="" onSetStatus={vi.fn()} showTopAts={false} onToggleTopAts={vi.fn()} />)
    expect(screen.getByPlaceholderText(/Search by name/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
  })

  it('renders Top Picks button', () => {
    render(<MobileControls search="" onSearchChange={vi.fn()} activeStatus="" onSetStatus={vi.fn()} showTopAts={false} onToggleTopAts={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Top Picks/ })).toBeInTheDocument()
  })

  it('renders status chips formatted', () => {
    render(<MobileControls search="" onSearchChange={vi.fn()} activeStatus="" onSetStatus={vi.fn()} showTopAts={false} onToggleTopAts={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Under Review' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Interviewing' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rejected' })).toBeInTheDocument()
  })

  it('toggles status off when clicking active chip', async () => {
    const onSetStatus = vi.fn()
    render(<MobileControls search="" onSearchChange={vi.fn()} activeStatus="filtered" onSetStatus={onSetStatus} showTopAts={false} onToggleTopAts={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Filtered' }))
    expect(onSetStatus).toHaveBeenCalledWith('')
  })

  it('sets status when clicking inactive chip', async () => {
    const onSetStatus = vi.fn()
    render(<MobileControls search="" onSearchChange={vi.fn()} activeStatus="" onSetStatus={onSetStatus} showTopAts={false} onToggleTopAts={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Selected' }))
    expect(onSetStatus).toHaveBeenCalledWith('selected')
  })

  it('calls onSearchChange on input', async () => {
    const onSearchChange = vi.fn()
    render(<MobileControls search="" onSearchChange={onSearchChange} activeStatus="" onSetStatus={vi.fn()} showTopAts={false} onToggleTopAts={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText(/Search by name/), 'a')
    expect(onSearchChange).toHaveBeenCalled()
  })

  it('calls onToggleTopAts when top picks pressed', async () => {
    const onToggleTopAts = vi.fn()
    render(<MobileControls search="" onSearchChange={vi.fn()} activeStatus="" onSetStatus={vi.fn()} showTopAts={false} onToggleTopAts={onToggleTopAts} />)
    await userEvent.click(screen.getByRole('button', { name: /Top Picks/ }))
    expect(onToggleTopAts).toHaveBeenCalledTimes(1)
  })
})
