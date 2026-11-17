import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobFolderHeader } from '../JobFolderHeader'
import type { JobFolder } from '../../../../../../shared/types/index'

const folder: JobFolder = {
  id: 'j1', jobTitle: 'Senior Engineer', department: 'R&D', location: 'Remote',
  candidatesCount: 5, filteredCount: 1, status: 'active', createdAt: '',
  topCandidates: [], applicationHistory: [],
}

function renderHeader(overrides: Partial<Parameters<typeof JobFolderHeader>[0]> = {}) {
  const props = {
    folder,
    isLoading: false,
    isMobile: false,
    resumePanel: null,
    processedCount: 5,
    unprocessedCount: 2,
    failedCount: 1,
    resumesLoading: false,
    onPanelToggle: vi.fn(),
    onUploadOpen: vi.fn(),
    onConfigureRounds: vi.fn(),
    onBack: vi.fn(),
    ...overrides,
  }
  const rtl = render(<JobFolderHeader {...props} />)
  return { ...rtl, ...props }
}

describe('JobFolderHeader', () => {
  it('renders the job title and metadata', () => {
    renderHeader()
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
    expect(screen.getByText('R&D')).toBeInTheDocument()
    expect(screen.getByText('Remote')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders skeleton when loading', () => {
    const { container } = renderHeader({ isLoading: true, folder: undefined })
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBeGreaterThan(0)
  })

  it('renders "Job Folder" fallback title when folder undefined', () => {
    renderHeader({ folder: undefined })
    expect(screen.getByText('Job Folder')).toBeInTheDocument()
  })

  it('renders the processed/unprocessed/failed counts', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /5 Processed/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /2 Unprocessed/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /1 Failed/ })).toBeInTheDocument()
  })

  it('renders dashes for processed/unprocessed when resumesLoading', () => {
    renderHeader({ resumesLoading: true })
    expect(screen.getByRole('button', { name: /– Processed/ })).toBeInTheDocument()
  })

  it('fires onPanelToggle with the right filter', async () => {
    const props = renderHeader()
    await userEvent.click(screen.getByRole('button', { name: /Processed/ }))
    expect(props.onPanelToggle).toHaveBeenCalledWith('processed')
  })

  it('fires onUploadOpen', async () => {
    const props = renderHeader()
    await userEvent.click(screen.getByRole('button', { name: /Upload Resumes/ }))
    expect(props.onUploadOpen).toHaveBeenCalled()
  })

  it('fires onBack', async () => {
    const props = renderHeader()
    await userEvent.click(screen.getByRole('button', { name: /Job Folders/ }))
    expect(props.onBack).toHaveBeenCalled()
  })
})
