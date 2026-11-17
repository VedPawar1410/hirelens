import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AIAnalysisCard } from '../AIAnalysisCard'
import type { CandidateDetail } from '../../../../../../shared/types/index'

const candidate: CandidateDetail = {
  id: 'c1', name: 'A', currentRole: 'Dev', avatarUrl: null,
  matchScore: 88, isDuplicate: false,
  appliedJob: null, applicationSource: 'Direct Upload',
  status: 'shortlisted', appliedDate: '',
  email: null, phone: null, linkedIn: null, gitHub: null,
  skills: null, experience: 5, education: 'B.S.',
  skippedRounds: [],
  resumeBase64: null, jobDescBase64: null, resumeFileName: null, jobDescFileName: null,
}

describe('AIAnalysisCard (interviewer)', () => {
  it('renders header and sections', () => {
    render(<AIAnalysisCard matchScore={88} skills={['ts']} candidate={candidate} isMobile={false} />)
    expect(screen.getByText('AI Analysis Engine')).toBeInTheDocument()
    expect(screen.getByText('JD Match Score')).toBeInTheDocument()
    expect(screen.getByText('Verified Skills')).toBeInTheDocument()
  })

  it('renders match score', () => {
    render(<AIAnalysisCard matchScore={88} skills={[]} candidate={null} isMobile={false} />)
    expect(screen.getByText('88%')).toBeInTheDocument()
  })

  it('shows "Not analyzed yet" when matchScore null', () => {
    render(<AIAnalysisCard matchScore={null} skills={[]} candidate={null} isMobile={false} />)
    expect(screen.getByText('Not analyzed yet')).toBeInTheDocument()
  })

  it('renders skills', () => {
    render(<AIAnalysisCard matchScore={70} skills={['React', 'Go']} candidate={null} isMobile={false} />)
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Go')).toBeInTheDocument()
  })

  it('renders experience and education when candidate provided', () => {
    render(<AIAnalysisCard matchScore={70} skills={[]} candidate={candidate} isMobile={false} />)
    expect(screen.getByText('5 years')).toBeInTheDocument()
    expect(screen.getByText('B.S.')).toBeInTheDocument()
  })

  it('omits experience section when candidate null', () => {
    render(<AIAnalysisCard matchScore={70} skills={[]} candidate={null} isMobile={false} />)
    expect(screen.queryByText('Experience')).toBeNull()
  })
})
