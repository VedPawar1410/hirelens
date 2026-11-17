import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResumeCard } from '../ResumeCard'
import type { CandidateDetail } from '../../../../../../shared/types/index'

function candidate(overrides: Partial<CandidateDetail> = {}): CandidateDetail {
  return {
    id: 'c1', name: 'A', currentRole: 'Dev', avatarUrl: null,
    matchScore: 88, isDuplicate: false,
    appliedJob: null, applicationSource: 'Direct Upload',
    status: 'shortlisted', appliedDate: '',
    email: null, phone: null, linkedIn: null, gitHub: null,
    skills: null, experience: null, education: null,
    skippedRounds: [],
    resumeBase64: null, jobDescBase64: null, resumeFileName: null, jobDescFileName: null,
    ...overrides,
  }
}

describe('ResumeCard (interviewer)', () => {
  it('renders Loading when isLoading', () => {
    render(<ResumeCard candidate={null} resumeBlobUrl={null} isLoading />)
    expect(screen.getByText('Loading resume…')).toBeInTheDocument()
  })

  it('renders empty state when no resume', () => {
    render(<ResumeCard candidate={candidate()} resumeBlobUrl={null} isLoading={false} />)
    expect(screen.getByText('No resume available.')).toBeInTheDocument()
  })

  it('renders iframe when blob url present', () => {
    const { container } = render(<ResumeCard candidate={candidate()} resumeBlobUrl="blob:x" isLoading={false} />)
    expect(container.querySelector('iframe')).toBeTruthy()
  })

  it('renders Download link when PDF + filename', () => {
    render(<ResumeCard candidate={candidate({ resumeBase64: 'abc', resumeFileName: 'r.pdf' })} resumeBlobUrl="blob:x" isLoading={false} />)
    expect(screen.getByText('Download').closest('a')?.getAttribute('download')).toBe('r.pdf')
  })
})
