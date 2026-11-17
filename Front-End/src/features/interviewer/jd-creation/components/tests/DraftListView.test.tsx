import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DraftListView } from '../DraftListView'
import type { JDDraft } from '../../../../../shared/types'

function draft(overrides: Partial<JDDraft> = {}): JDDraft {
  return {
    id: 'd1', experienceLevel: 'experienced', jobTitle: 'Eng',
    location: 'Remote', workMode: 'Hybrid', workHours: '40',
    duration: 'Full-time', stipendSalary: '', fulltimeOfferSalary: '100k',
    yearsOfExperience: '3-5', noticePeriod: '', relevantExperience: '',
    roleDescription: '', generatedJd: '', assignedTo: ['iv1'], interviewRounds: [],
    status: 'assigned', createdBy: 'rec1', createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('DraftListView', () => {
  it('renders skeleton when loading + no drafts', () => {
    const { container } = render(<DraftListView drafts={[]} isLoading onSelect={vi.fn()} selectedId={null} />)
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBe(3)
  })

  it('renders empty section when no assigned drafts', () => {
    render(<DraftListView drafts={[]} isLoading={false} onSelect={vi.fn()} selectedId={null} />)
    expect(screen.getByText('No JDs assigned yet.')).toBeInTheDocument()
  })

  it('renders assigned drafts with SAVED chip when roleDescription set', () => {
    render(<DraftListView drafts={[draft({ roleDescription: 'desc' })]} isLoading={false} onSelect={vi.fn()} selectedId={null} />)
    expect(screen.getByText('Eng')).toBeInTheDocument()
    expect(screen.getByText('SAVED')).toBeInTheDocument()
  })

  it('omits SAVED chip when roleDescription empty', () => {
    render(<DraftListView drafts={[draft()]} isLoading={false} onSelect={vi.fn()} selectedId={null} />)
    expect(screen.queryByText('SAVED')).toBeNull()
  })

  it('emits onSelect when assigned card clicked', async () => {
    const onSelect = vi.fn()
    const d = draft()
    render(<DraftListView drafts={[d]} isLoading={false} onSelect={onSelect} selectedId={null} />)
    await userEvent.click(screen.getByText('Eng'))
    expect(onSelect).toHaveBeenCalledWith(d)
  })

  it('renders Recently Submitted section when returned/finalized drafts present', () => {
    render(<DraftListView drafts={[draft({ status: 'finalized', jobTitle: 'Designer' })]} isLoading={false} onSelect={vi.fn()} selectedId={null} />)
    expect(screen.getByText('Recently Submitted')).toBeInTheDocument()
    expect(screen.getByText('Designer')).toBeInTheDocument()
    expect(screen.getByText('Finalised')).toBeInTheDocument()
  })

  it('renders "Pending review" for returned drafts', () => {
    render(<DraftListView drafts={[draft({ status: 'returned', jobTitle: 'X' })]} isLoading={false} onSelect={vi.fn()} selectedId={null} />)
    expect(screen.getByText('Pending review')).toBeInTheDocument()
  })
})
