import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DraftDetailView } from '../DraftDetailView'
import type { JDDraft } from '../../../../../shared/types'

function draft(overrides: Partial<JDDraft> = {}): JDDraft {
  return {
    id: 'd1', experienceLevel: 'experienced', jobTitle: 'Frontend Engineer',
    location: 'Remote', workMode: 'Hybrid', workHours: '40',
    duration: 'Full-time', stipendSalary: '', fulltimeOfferSalary: '100k',
    yearsOfExperience: '3-5', noticePeriod: '30 days', relevantExperience: '',
    roleDescription: '', generatedJd: '', assignedTo: ['iv1'], interviewRounds: [],
    status: 'assigned', createdBy: 'rec1', createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('DraftDetailView', () => {
  it('renders title, level, metadata', () => {
    render(<DraftDetailView draft={draft()} roleDescription="" onRoleDescriptionChange={vi.fn()} onBack={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />)
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Experienced')).toBeInTheDocument()
    expect(screen.getByText('Remote')).toBeInTheDocument()
    expect(screen.getByText('Hybrid')).toBeInTheDocument()
  })

  it('shows word count for role description', () => {
    render(<DraftDetailView draft={draft()} roleDescription="one two three" onRoleDescriptionChange={vi.fn()} onBack={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />)
    expect(screen.getByText('3/50+ words')).toBeInTheDocument()
  })

  it('fires onRoleDescriptionChange on textarea input', async () => {
    const onRoleDescriptionChange = vi.fn()
    render(<DraftDetailView draft={draft()} roleDescription="" onRoleDescriptionChange={onRoleDescriptionChange} onBack={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />)
    await userEvent.type(screen.getByPlaceholderText(/You.re the domain expert/), 'x')
    expect(onRoleDescriptionChange).toHaveBeenCalled()
  })

  it('disables submit when description empty', () => {
    render(<DraftDetailView draft={draft()} roleDescription="" onRoleDescriptionChange={vi.fn()} onBack={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />)
    expect(screen.getByRole('button', { name: 'Submit Back to Recruitment' })).toBeDisabled()
  })

  it('enables submit when description has content', () => {
    render(<DraftDetailView draft={draft()} roleDescription="some text" onRoleDescriptionChange={vi.fn()} onBack={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />)
    expect(screen.getByRole('button', { name: 'Submit Back to Recruitment' })).toBeEnabled()
  })

  it('back button calls onBack', async () => {
    const onBack = vi.fn()
    render(<DraftDetailView draft={draft()} roleDescription="" onRoleDescriptionChange={vi.fn()} onBack={onBack} onSubmit={vi.fn()} isSubmitting={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('clicking an AI starter bullet appends it to role description', async () => {
    const onRoleDescriptionChange = vi.fn()
    render(<DraftDetailView draft={draft({ jobTitle: 'Frontend Engineer' })} roleDescription="" onRoleDescriptionChange={onRoleDescriptionChange} onBack={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />)
    const firstBullet = screen.getByText(/Build product-critical recruiter/)
    await userEvent.click(firstBullet)
    expect(onRoleDescriptionChange).toHaveBeenCalledWith(expect.stringContaining('• Build product-critical recruiter'))
  })
})
