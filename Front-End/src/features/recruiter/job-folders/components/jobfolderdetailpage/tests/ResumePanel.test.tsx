import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResumePanel } from '../ResumePanel'
import type { Resume } from '../../../../jd-creation/api/resumeApi'

function resume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: 'r1', filename: 'alice.pdf', uploadedAt: '2026-01-01',
    status: 'processed', matchScore: 88, candidateId: 'c1', errorReason: null,
    ...overrides,
  }
}

describe('ResumePanel', () => {
  it('renders processed title and resumes', () => {
    render(<ResumePanel filter="processed" resumes={[resume()]} isLoading={false} onClose={vi.fn()} isMobile={false} panelWidth={400} />)
    expect(screen.getByText('Processed Resumes')).toBeInTheDocument()
    expect(screen.getByText('alice.pdf')).toBeInTheDocument()
    expect(screen.getByText('88%')).toBeInTheDocument()
  })

  it('renders empty state when no resumes', () => {
    render(<ResumePanel filter="processed" resumes={[]} isLoading={false} onClose={vi.fn()} isMobile={false} panelWidth={400} />)
    expect(screen.getByText('No processed resumes yet')).toBeInTheDocument()
  })

  it('renders skeletons while loading (non-failed)', () => {
    const { container } = render(<ResumePanel filter="processed" resumes={[]} isLoading onClose={vi.fn()} isMobile={false} panelWidth={400} />)
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBeGreaterThan(0)
  })

  it('renders Pending chip for unprocessed resumes', () => {
    render(<ResumePanel filter="unprocessed" resumes={[resume({ status: 'unprocessed', matchScore: null })]} isLoading={false} onClose={vi.fn()} isMobile={false} panelWidth={400} />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders failed files with error text', () => {
    render(<ResumePanel filter="failed" resumes={[]} failedFiles={[{ fileName: 'bad.pdf', error: 'Parse error' }]} isLoading={false} onClose={vi.fn()} isMobile={false} panelWidth={400} />)
    expect(screen.getByText('bad.pdf')).toBeInTheDocument()
    expect(screen.getByText('Parse error')).toBeInTheDocument()
  })

  it('fires onClose when close button clicked', async () => {
    const onClose = vi.fn()
    render(<ResumePanel filter="processed" resumes={[]} isLoading={false} onClose={onClose} isMobile={false} panelWidth={400} />)
    await userEvent.click(screen.getByLabelText('Close panel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('Clear All shown for failed + calls onClearAllFailed', async () => {
    const onClearAllFailed = vi.fn()
    render(<ResumePanel filter="failed" resumes={[]} failedFiles={[{ fileName: 'b.pdf', error: 'x' }]} isLoading={false} onClose={vi.fn()} isMobile={false} panelWidth={400} onClearAllFailed={onClearAllFailed} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear All' }))
    expect(onClearAllFailed).toHaveBeenCalled()
  })
})
