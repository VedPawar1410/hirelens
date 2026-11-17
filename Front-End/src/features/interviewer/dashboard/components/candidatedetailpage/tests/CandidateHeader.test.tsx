import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CandidateHeader } from '../CandidateHeader'
import type { InterviewWithDetails } from '../../../../../recruiter/candidates/api/interviewsApi'
import type { CandidateDetail } from '../../../../../../shared/types/index'

const interview: InterviewWithDetails = {
  interviewId: 'i1', candidateId: 'c1', jobId: 'j1', interviewerId: 'iv1',
  scheduledAt: '', durationMinutes: 60,
  interviewType: 'Technical', interviewRound: 1, roundName: 'Tech Round 1',
  meetingLink: null, location: null, status: 'Scheduled',
  overallRating: null, recommendation: null, feedbackNotes: null,
  noShowReason: null, rescheduleCount: 0,
  createdAt: '', updatedAt: '',
  candidateName: 'Alice', candidateRole: 'Dev',
  candidateMatchScore: 88, candidateAvatarUrl: null, candidateSkills: null,
  jobTitle: 'Engineer',
}

const candidate: CandidateDetail = {
  id: 'c1', name: 'Alice', currentRole: 'Dev', avatarUrl: null,
  matchScore: 88, isDuplicate: false,
  appliedJob: { id: 'j1', title: 'Eng' },
  applicationSource: 'Direct Upload',
  status: 'shortlisted', appliedDate: '2026-01-01',
  email: 'a@x.com', phone: '555', linkedIn: 'https://linkedin.com/in/a', gitHub: 'https://github.com/a',
  skills: null, experience: null, education: null,
  skippedRounds: [],
  resumeBase64: null, jobDescBase64: null, resumeFileName: null, jobDescFileName: null,
}

describe('CandidateHeader (interviewer)', () => {
  it('renders candidate name', () => {
    render(<CandidateHeader interview={interview} candidate={candidate} matchScore={null} isMobile={false} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('falls back to candidateRole/jobTitle when candidate.currentRole missing', () => {
    render(<CandidateHeader interview={interview} candidate={null} matchScore={null} isMobile={false} />)
    expect(screen.getByText('Dev')).toBeInTheDocument()
  })

  it('renders status badge', () => {
    render(<CandidateHeader interview={interview} candidate={candidate} matchScore={null} isMobile={false} />)
    expect(screen.getByText('Shortlisted')).toBeInTheDocument()
  })

  it('renders Duplicate flag when set', () => {
    render(<CandidateHeader interview={interview} candidate={{ ...candidate, isDuplicate: true }} matchScore={null} isMobile={false} />)
    expect(screen.getByText('Duplicate')).toBeInTheDocument()
  })

  it('renders contact details', () => {
    render(<CandidateHeader interview={interview} candidate={candidate} matchScore={null} isMobile={false} />)
    expect(screen.getByText('a@x.com')).toBeInTheDocument()
    expect(screen.getByText('555')).toBeInTheDocument()
    expect(screen.getByText('linkedin.com/in/a')).toBeInTheDocument()
    expect(screen.getByText('github.com/a')).toBeInTheDocument()
  })

  it('falls back to "Candidate" when name null', () => {
    render(<CandidateHeader interview={{ ...interview, candidateName: null }} candidate={null} matchScore={null} isMobile={false} />)
    expect(screen.getByText('Candidate')).toBeInTheDocument()
  })
})
