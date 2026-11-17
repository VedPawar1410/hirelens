import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JDListPanel } from '../JDListPanel'
import { ToastContext } from '../../../../../shared/components/Toast/ToastProvider'
import type { JDDraft } from '../../../../../shared/types'

function draft(overrides: Partial<JDDraft> = {}): JDDraft {
  return {
    id: 'd1', experienceLevel: 'experienced', jobTitle: 'Engineer',
    location: 'Remote', workMode: 'Hybrid', workHours: '40',
    duration: '', stipendSalary: '', fulltimeOfferSalary: '',
    yearsOfExperience: '', noticePeriod: '', relevantExperience: '',
    roleDescription: 'A description', generatedJd: '', assignedTo: [], interviewRounds: [],
    status: 'finalized', createdBy: 'rec1', createdAt: '2026-01-01',
    ...overrides,
  }
}

function renderPanel(props: Partial<Parameters<typeof JDListPanel>[0]> = {}) {
  const merged = {
    drafts: [draft()], isLoading: false, copiedIds: new Set<string>(),
    onCopy: vi.fn(), onEditFinalized: vi.fn(), onRetryGenerate: vi.fn(),
    generatingDraftId: null, onDelete: vi.fn(), isDeleting: false,
    ...props,
  }
  const wrap = (ui: ReactNode) => <ToastContext.Provider value={{ showToast: vi.fn() }}>{ui}</ToastContext.Provider>
  return { merged, ...render(wrap(<JDListPanel {...merged} />)) }
}

describe('JDListPanel', () => {
  it('renders draft job title', () => {
    renderPanel()
    expect(screen.getByText('Engineer')).toBeInTheDocument()
  })

  it('shows skeletons while loading with no drafts', () => {
    // hideHeader forces the list visible (otherwise it stays collapsed with 0 drafts)
    const { container } = renderPanel({ drafts: [], isLoading: true, hideHeader: true })
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBeGreaterThan(0)
  })

  it('shows empty message when no drafts', () => {
    renderPanel({ drafts: [], isLoading: false, hideHeader: true })
    expect(screen.getByText(/No Jd's yet/)).toBeInTheDocument()
  })

  it('renders Copy + Edit for finalized drafts with roleDescription', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /Copy/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument()
  })

  it('shows "Copied!" when id is in copiedIds', () => {
    renderPanel({ copiedIds: new Set(['d1']) })
    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })

  it('renders Retry for draft status', () => {
    renderPanel({ drafts: [draft({ status: 'draft' })] })
    expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument()
  })

  it('fires onCopy with id + roleDescription', async () => {
    const onCopy = vi.fn()
    renderPanel({ onCopy })
    await userEvent.click(screen.getByRole('button', { name: /Copy/ }))
    expect(onCopy).toHaveBeenCalledWith('d1', 'A description')
  })

  it('fires onEditFinalized', async () => {
    const onEditFinalized = vi.fn()
    const d = draft()
    renderPanel({ drafts: [d], onEditFinalized })
    await userEvent.click(screen.getByRole('button', { name: /Edit/ }))
    expect(onEditFinalized).toHaveBeenCalledWith(d)
  })

  it('fires onDelete', async () => {
    const onDelete = vi.fn()
    renderPanel({ onDelete })
    await userEvent.click(screen.getByTitle('Delete JD'))
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('d1')
  })
})
