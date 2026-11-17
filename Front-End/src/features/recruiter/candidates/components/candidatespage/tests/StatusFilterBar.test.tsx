import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusFilterBar } from '../StatusFilterBar'

const counts = {
  underReview: 1, filtered: 2, shortlisted: 3,
  interviewing: 4,
  selected: 9,
}

describe('StatusFilterBar', () => {
  it('renders search input with current value', () => {
    render(<StatusFilterBar search="alice" onSearchChange={vi.fn()} activeStatus="" onSetStatus={vi.fn()} countsData={counts} />)
    expect(screen.getByPlaceholderText(/Search by name/)).toHaveValue('alice')
  })

  it('emits onSearchChange as user types', async () => {
    const onSearchChange = vi.fn()
    render(<StatusFilterBar search="" onSearchChange={onSearchChange} activeStatus="" onSetStatus={vi.fn()} countsData={counts} />)
    await userEvent.type(screen.getByPlaceholderText(/Search by name/), 'x')
    expect(onSearchChange).toHaveBeenCalled()
  })

  it('renders all stage chips when counts provided', () => {
    render(<StatusFilterBar search="" onSearchChange={vi.fn()} activeStatus="" onSetStatus={vi.fn()} countsData={counts} />)
    for (const label of ['Under Review', 'Filtered', 'Shortlisted', 'Interviewing', 'Selected']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument()
    }
  })

  it('omits stage chips when countsData is undefined', () => {
    render(<StatusFilterBar search="" onSearchChange={vi.fn()} activeStatus="" onSetStatus={vi.fn()} countsData={undefined} />)
    expect(screen.queryByRole('button', { name: /Under Review/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
  })

  it('emits onSetStatus("") for All chip', async () => {
    const onSetStatus = vi.fn()
    render(<StatusFilterBar search="" onSearchChange={vi.fn()} activeStatus="shortlisted" onSetStatus={onSetStatus} countsData={counts} />)
    await userEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(onSetStatus).toHaveBeenCalledWith('')
  })

  it('toggles back to "" when clicking the active chip again', async () => {
    const onSetStatus = vi.fn()
    render(<StatusFilterBar search="" onSearchChange={vi.fn()} activeStatus="shortlisted" onSetStatus={onSetStatus} countsData={counts} />)
    await userEvent.click(screen.getByRole('button', { name: /Shortlisted/ }))
    expect(onSetStatus).toHaveBeenCalledWith('')
  })

  it('emits the clicked status when not active', async () => {
    const onSetStatus = vi.fn()
    render(<StatusFilterBar search="" onSearchChange={vi.fn()} activeStatus="" onSetStatus={onSetStatus} countsData={counts} />)
    await userEvent.click(screen.getByRole('button', { name: /Filtered/ }))
    expect(onSetStatus).toHaveBeenCalledWith('filtered')
  })
})
