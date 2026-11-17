import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CandidateProfileHeader } from '../CandidateProfileHeader'
import type { Candidate } from '../../../../../../shared/types/index'

const base: Candidate = {
  id: 'c1', name: 'Alice', currentRole: 'Dev', avatarUrl: null,
  matchScore: 88, isDuplicate: false,
  appliedJob: { id: 'j1', title: 'Eng' }, applicationSource: 'Direct Upload',
  status: 'shortlisted', appliedDate: '2026-01-01',
  email: 'alice@example.com', phone: '555-1234',
  linkedIn: 'https://linkedin.com/in/alice', gitHub: 'https://github.com/alice',
  skills: null, experience: null, education: null,
}

const badge = { label: 'Shortlisted', color: '#a78bfa', bg: 'rgba(0,0,0,0.5)' }

function renderHeader(overrides: Partial<Parameters<typeof CandidateProfileHeader>[0]> = {}) {
  const props = {
    candidate: base, isMobile: false, fromJobFolder: false,
    prevId: null, nextId: null, badge,
    onBack: vi.fn(), onPrevCandidate: vi.fn(), onNextCandidate: vi.fn(),
    ...overrides,
  }
  render(<CandidateProfileHeader {...props} />)
  return props
}

describe('CandidateProfileHeader', () => {
  it('renders name, role, badge', () => {
    renderHeader()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Dev')).toBeInTheDocument()
    expect(screen.getByText('Shortlisted')).toBeInTheDocument()
  })

  it('back button label changes when fromJobFolder', () => {
    renderHeader({ fromJobFolder: true })
    expect(screen.getByRole('button', { name: /Back to Job Folder/ })).toBeInTheDocument()
  })

  it('back button defaults to "Back to Candidates"', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /Back to Candidates/ })).toBeInTheDocument()
  })

  it('renders prev/next nav buttons when fromJobFolder + ids provided', () => {
    renderHeader({ fromJobFolder: true, prevId: 'p1', nextId: 'n1' })
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3)
  })

  it('hides prev/next nav when prevId+nextId both null', () => {
    renderHeader({ fromJobFolder: true })
    // Only the back button is rendered (no prev/next chevrons)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('renders Duplicate chip when duplicate', () => {
    renderHeader({ candidate: { ...base, isDuplicate: true } })
    expect(screen.getByText('Duplicate')).toBeInTheDocument()
  })

  it('renders email/phone/linkedin/github when present', () => {
    renderHeader()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('555-1234')).toBeInTheDocument()
    expect(screen.getByText('linkedin.com/in/alice')).toBeInTheDocument()
    expect(screen.getByText('github.com/alice')).toBeInTheDocument()
  })

  it('calls onBack when back button clicked', async () => {
    const props = renderHeader()
    await userEvent.click(screen.getByRole('button', { name: /Back/ }))
    expect(props.onBack).toHaveBeenCalled()
  })
})
