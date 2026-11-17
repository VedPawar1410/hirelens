import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TableHeader, JobTableRow, MobileJobRow } from '../JobRows'
import type { JobFolder } from '../../../../../../shared/types/index'

const folder: JobFolder = {
  id: 'j1', jobTitle: 'Engineer', department: 'R&D', location: 'Remote',
  candidatesCount: 100, filteredCount: 30, status: 'active', createdAt: new Date().toISOString(),
  topCandidates: [], applicationHistory: [1, 2, 3, 4, 5],
}

describe('TableHeader', () => {
  it('renders all 5 column labels', () => {
    render(<TableHeader />)
    for (const h of ['Role', 'Pipeline', 'Fill Rate', 'Top Candidates', 'Status']) {
      expect(screen.getByText(h)).toBeInTheDocument()
    }
  })
})

describe('JobTableRow', () => {
  it('renders title and department/location', () => {
    render(<JobTableRow folder={folder} isLast={false} onClick={vi.fn()} onStatusChange={vi.fn()} />)
    expect(screen.getByText('Engineer')).toBeInTheDocument()
    expect(screen.getByText('R&D')).toBeInTheDocument()
    expect(screen.getByText('Remote')).toBeInTheDocument()
  })

  it('renders candidatesCount + Applied label', () => {
    render(<JobTableRow folder={folder} isLast={false} onClick={vi.fn()} onStatusChange={vi.fn()} />)
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('Applied')).toBeInTheDocument()
  })

  it('renders fill rate percentage', () => {
    render(<JobTableRow folder={folder} isLast={false} onClick={vi.fn()} onStatusChange={vi.fn()} />)
    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('of 100')).toBeInTheDocument()
  })

  it('fires onClick when row body clicked', async () => {
    const onClick = vi.fn()
    render(<JobTableRow folder={folder} isLast={false} onClick={onClick} onStatusChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open Engineer' }))
    expect(onClick).toHaveBeenCalled()
  })
})

describe('MobileJobRow', () => {
  it('renders title + Applied + Filtered counts', () => {
    render(<MobileJobRow folder={folder} isLast={false} onClick={vi.fn()} onStatusChange={vi.fn()} />)
    expect(screen.getByText('Engineer')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('Filtered')).toBeInTheDocument()
  })
})
