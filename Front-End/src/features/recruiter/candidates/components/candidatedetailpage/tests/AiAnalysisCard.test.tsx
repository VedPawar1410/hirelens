import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AiAnalysisCard } from '../AiAnalysisCard'
import type { Candidate } from '../../../../../../shared/types/index'

const base: Candidate = {
  id: 'c1', name: 'Alice', currentRole: 'Dev', avatarUrl: null,
  matchScore: 88, isDuplicate: false,
  appliedJob: { id: 'j1', title: 'Eng' }, applicationSource: 'Direct Upload',
  status: 'shortlisted', appliedDate: '2026-01-01',
  email: null, phone: null, linkedIn: null, gitHub: null,
  skills: ['TypeScript', 'React'], experience: 5, education: 'B.S. CS',
}

describe('AiAnalysisCard', () => {
  it('renders header and section titles', () => {
    render(<AiAnalysisCard candidate={base} isMobile={false} />)
    expect(screen.getByText('AI Analysis Engine')).toBeInTheDocument()
    expect(screen.getByText('JD Match Score')).toBeInTheDocument()
    expect(screen.getByText('Verified Skills')).toBeInTheDocument()
  })

  it('renders match score percentage', () => {
    render(<AiAnalysisCard candidate={base} isMobile={false} />)
    expect(screen.getByText('88%')).toBeInTheDocument()
  })

  it('renders "Not analyzed yet" when matchScore is null', () => {
    render(<AiAnalysisCard candidate={{ ...base, matchScore: null }} isMobile={false} />)
    expect(screen.getByText('Not analyzed yet')).toBeInTheDocument()
  })

  it('renders all skills as chips', () => {
    render(<AiAnalysisCard candidate={base} isMobile={false} />)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  it('shows "No skills recorded." when skills empty', () => {
    render(<AiAnalysisCard candidate={{ ...base, skills: [] }} isMobile={false} />)
    expect(screen.getByText('No skills recorded.')).toBeInTheDocument()
  })

  it('renders experience in years (pluralized)', () => {
    render(<AiAnalysisCard candidate={base} isMobile={false} />)
    expect(screen.getByText('5 years')).toBeInTheDocument()
  })

  it('renders singular "year" for experience=1', () => {
    render(<AiAnalysisCard candidate={{ ...base, experience: 1 }} isMobile={false} />)
    expect(screen.getByText('1 year')).toBeInTheDocument()
  })

  it('renders education when provided', () => {
    render(<AiAnalysisCard candidate={base} isMobile={false} />)
    expect(screen.getByText('B.S. CS')).toBeInTheDocument()
  })

  it('omits experience/education section when both blank', () => {
    render(<AiAnalysisCard candidate={{ ...base, experience: null, education: null }} isMobile={false} />)
    expect(screen.queryByText('Experience')).toBeNull()
    expect(screen.queryByText('Education')).toBeNull()
  })
})
