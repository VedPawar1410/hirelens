import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusDropdown } from '../StatusDropdown'
import type { JobFolder } from '../../../../../../shared/types/index'

const folder: JobFolder = {
  id: 'j1', jobTitle: 'Eng', department: 'R&D', location: 'X',
  candidatesCount: 1, filteredCount: 0, status: 'active', createdAt: '',
  topCandidates: [], applicationHistory: [],
}

describe('StatusDropdown', () => {
  it('renders current status label closed by default', () => {
    render(<StatusDropdown folder={folder} onStatusChange={vi.fn()} />)
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /Paused/ })).toBeNull()
  })

  it('opens dropdown options on click', async () => {
    render(<StatusDropdown folder={folder} onStatusChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Active/ }))
    expect(screen.getByRole('button', { name: /Paused/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Closed/ })).toBeInTheDocument()
  })

  it('emits onStatusChange with new status', async () => {
    const onStatusChange = vi.fn()
    render(<StatusDropdown folder={folder} onStatusChange={onStatusChange} />)
    await userEvent.click(screen.getByRole('button', { name: /Active/ }))
    await userEvent.click(screen.getByRole('button', { name: /Paused/ }))
    expect(onStatusChange).toHaveBeenCalledWith('j1', 'paused')
  })

  it('closes when clicking outside', async () => {
    render(<StatusDropdown folder={folder} onStatusChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Active/ }))
    expect(screen.getByRole('button', { name: /Paused/ })).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('button', { name: /Paused/ })).toBeNull()
  })
})
