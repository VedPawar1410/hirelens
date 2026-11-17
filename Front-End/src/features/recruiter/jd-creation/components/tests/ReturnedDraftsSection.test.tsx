import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReturnedDraftsSection } from '../ReturnedDraftsSection'
import type { JDDraft } from '../../../../../shared/types'

function draft(overrides: Partial<JDDraft> = {}): JDDraft {
  return {
    id: 'd1', experienceLevel: 'experienced', jobTitle: 'Eng',
    location: 'Remote', workMode: 'Hybrid', workHours: '40',
    duration: '', stipendSalary: '', fulltimeOfferSalary: '100k',
    yearsOfExperience: '3-5', noticePeriod: '', relevantExperience: '',
    roleDescription: 'Lorem ipsum dolor sit amet '.repeat(20),
    generatedJd: '', assignedTo: ['iv1'], interviewRounds: [],
    status: 'returned', createdBy: 'rec1', createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('ReturnedDraftsSection', () => {
  it('renders nothing when drafts empty', () => {
    const { container } = render(<ReturnedDraftsSection drafts={[]} generatingDraftId={null} onReview={vi.fn()} onCreateJD={vi.fn()} onDelete={vi.fn()} isDeleting={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders count summary in singular and plural', () => {
    render(<ReturnedDraftsSection drafts={[draft()]} generatingDraftId={null} onReview={vi.fn()} onCreateJD={vi.fn()} onDelete={vi.fn()} isDeleting={false} />)
    expect(screen.getByText('1 JD')).toBeInTheDocument()
  })

  it('renders 2 JDs label for multi', () => {
    render(<ReturnedDraftsSection drafts={[draft(), draft({ id: 'd2' })]} generatingDraftId={null} onReview={vi.fn()} onCreateJD={vi.fn()} onDelete={vi.fn()} isDeleting={false} />)
    expect(screen.getByText('2 JDs')).toBeInTheDocument()
  })

  it('expands draft cards when Review Data clicked', async () => {
    render(<ReturnedDraftsSection drafts={[draft()]} generatingDraftId={null} onReview={vi.fn()} onCreateJD={vi.fn()} onDelete={vi.fn()} isDeleting={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Review Data' }))
    expect(screen.getAllByText('Eng').length).toBeGreaterThan(0)
  })

  it('calls onReview with first draft on Review JDs banner button', async () => {
    const onReview = vi.fn()
    const d = draft()
    render(<ReturnedDraftsSection drafts={[d]} generatingDraftId={null} onReview={onReview} onCreateJD={vi.fn()} onDelete={vi.fn()} isDeleting={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Review JDs' }))
    expect(onReview).toHaveBeenCalledWith(d)
  })

  it('calls onCreateJD when Create JD clicked in expanded card', async () => {
    const onCreateJD = vi.fn()
    render(<ReturnedDraftsSection drafts={[draft()]} generatingDraftId={null} onReview={vi.fn()} onCreateJD={onCreateJD} onDelete={vi.fn()} isDeleting={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Review Data' }))
    await userEvent.click(screen.getByRole('button', { name: /Create JD/ }))
    expect(onCreateJD).toHaveBeenCalledWith('d1')
  })

  it('calls onDelete when trash button clicked', async () => {
    const onDelete = vi.fn()
    render(<ReturnedDraftsSection drafts={[draft()]} generatingDraftId={null} onReview={vi.fn()} onCreateJD={vi.fn()} onDelete={onDelete} isDeleting={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Review Data' }))
    await userEvent.click(screen.getByTitle('Delete draft'))
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('d1')
  })
})
