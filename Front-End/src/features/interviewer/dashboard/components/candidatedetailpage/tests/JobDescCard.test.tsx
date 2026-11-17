import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JobDescCard } from '../JobDescCard'
import type { UseQueryResult } from '@tanstack/react-query'
import type { JDDraft, CandidateDetail } from '../../../../../../shared/types/index'

function q(overrides: Partial<UseQueryResult<JDDraft>> = {}): UseQueryResult<JDDraft> {
  return {
    data: undefined, isLoading: false, isError: false, error: null,
    isPending: false, isSuccess: false, status: 'success',
    ...overrides,
  } as unknown as UseQueryResult<JDDraft>
}

function candidate(overrides: Partial<CandidateDetail> = {}): CandidateDetail {
  return {
    id: 'c1', name: 'A', currentRole: 'Dev', avatarUrl: null,
    matchScore: 88, isDuplicate: false,
    appliedJob: { id: 'j1', title: 'Eng' }, applicationSource: 'Direct Upload',
    status: 'shortlisted', appliedDate: '',
    email: null, phone: null, linkedIn: null, gitHub: null,
    skills: null, experience: null, education: null,
    skippedRounds: [],
    resumeBase64: null, jobDescBase64: null, resumeFileName: null, jobDescFileName: null,
    ...overrides,
  }
}

describe('JobDescCard (interviewer)', () => {
  it('renders nothing when appliedJob null', () => {
    const { container } = render(<JobDescCard candidate={candidate({ appliedJob: null })} jdQuery={q()} jdBlobUrl={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders Loading when query loading', () => {
    render(<JobDescCard candidate={candidate()} jdQuery={q({ isLoading: true })} jdBlobUrl={null} />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders generatedJd content', () => {
    const draft = { jobTitle: 'Eng', generatedJd: 'JD body' } as JDDraft
    render(<JobDescCard candidate={candidate()} jdQuery={q({ data: draft })} jdBlobUrl={null} />)
    expect(screen.getByText('JD body')).toBeInTheDocument()
  })

  it('renders iframe when blob url provided', () => {
    const { container } = render(<JobDescCard candidate={candidate()} jdQuery={q({ data: { jobTitle: 'Eng' } as JDDraft })} jdBlobUrl="blob:x" />)
    expect(container.querySelector('iframe')).toBeTruthy()
  })

  it('renders Download link when PDF + filename', () => {
    render(<JobDescCard candidate={candidate({ jobDescBase64: 'abc', jobDescFileName: 'jd.pdf' })} jdQuery={q({ data: { jobTitle: 'Eng' } as JDDraft })} jdBlobUrl={null} />)
    const a = screen.getByText('Download').closest('a')
    expect(a?.getAttribute('download')).toBe('jd.pdf')
  })

  it('renders error fallback when neither data nor loading', () => {
    render(<JobDescCard candidate={candidate()} jdQuery={q()} jdBlobUrl={null} />)
    expect(screen.getByText('Could not load job description.')).toBeInTheDocument()
  })
})
