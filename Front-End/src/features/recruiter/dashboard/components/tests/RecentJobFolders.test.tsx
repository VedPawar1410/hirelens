import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecentJobFolders from '../RecentJobFolders'
import type { JobFolder } from '../../../../../shared/types'

const folder: JobFolder = {
  id: 'j1', jobTitle: 'Engineer', department: 'R&D', location: 'Remote',
  candidatesCount: 12, filteredCount: 3, status: 'active', createdAt: '2026-01-01',
  topCandidates: [], applicationHistory: [],
}

describe('RecentJobFolders', () => {
  it('renders header + View all', () => {
    render(<RecentJobFolders folders={[]} isLoading={false} onViewAll={vi.fn()} onFolderClick={vi.fn()} />)
    expect(screen.getByText('Recent Job Folders')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View all/ })).toBeInTheDocument()
  })

  it('renders skeleton rows when loading', () => {
    const { container } = render(<RecentJobFolders folders={[]} isLoading onViewAll={vi.fn()} onFolderClick={vi.fn()} />)
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBe(3)
  })

  it('shows empty state when no folders', () => {
    render(<RecentJobFolders folders={[]} isLoading={false} onViewAll={vi.fn()} onFolderClick={vi.fn()} />)
    expect(screen.getByText('No job folders yet')).toBeInTheDocument()
  })

  it('renders folder details', () => {
    render(<RecentJobFolders folders={[folder]} isLoading={false} onViewAll={vi.fn()} onFolderClick={vi.fn()} />)
    expect(screen.getByText('Engineer')).toBeInTheDocument()
    expect(screen.getByText(/R&D/)).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('fires onFolderClick with folder id', async () => {
    const onFolderClick = vi.fn()
    render(<RecentJobFolders folders={[folder]} isLoading={false} onViewAll={vi.fn()} onFolderClick={onFolderClick} />)
    await userEvent.click(screen.getByText('Engineer'))
    expect(onFolderClick).toHaveBeenCalledWith('j1')
  })

  it('fires onViewAll', async () => {
    const onViewAll = vi.fn()
    render(<RecentJobFolders folders={[]} isLoading={false} onViewAll={onViewAll} onFolderClick={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /View all/ }))
    expect(onViewAll).toHaveBeenCalled()
  })
})
