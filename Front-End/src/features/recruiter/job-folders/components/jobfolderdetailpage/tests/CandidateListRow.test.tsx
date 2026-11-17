import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CandidateListRow } from '../CandidateListRow'
import type { Candidate } from '../../../../../../shared/types/index'

const c: Candidate = {
  id: 'c1', name: 'Alice', currentRole: 'Engineer', avatarUrl: null,
  matchScore: 88, isDuplicate: false,
  appliedJob: { id: 'j1', title: 'Eng' }, applicationSource: 'LinkedIn API',
  status: 'shortlisted', appliedDate: '',
  email: null, phone: null, linkedIn: null, gitHub: null,
  skills: null, experience: null, education: null,
}

describe('CandidateListRow', () => {
  it('renders name, role, source badge, score', () => {
    render(<CandidateListRow candidate={c} isSelected={false} onClick={vi.fn()} isComputingScores={false} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Engineer')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByText('88')).toBeInTheDocument()
  })

  it('shows ellipsis when score null and computing', () => {
    render(<CandidateListRow candidate={{ ...c, matchScore: null }} isSelected={false} onClick={vi.fn()} isComputingScores />)
    expect(screen.getByText('…')).toBeInTheDocument()
  })

  it('shows em dash when score null and not computing', () => {
    render(<CandidateListRow candidate={{ ...c, matchScore: null }} isSelected={false} onClick={vi.fn()} isComputingScores={false} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders duplicate icon when duplicate', () => {
    const { container } = render(<CandidateListRow candidate={{ ...c, isDuplicate: true }} isSelected={false} onClick={vi.fn()} isComputingScores={false} />)
    expect(container.querySelector('svg.lucide-triangle-alert')).toBeTruthy()
  })

  it('fires onClick', async () => {
    const onClick = vi.fn()
    render(<CandidateListRow candidate={c} isSelected={false} onClick={onClick} isComputingScores={false} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
