import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CandidateListPane } from '../CandidateListPane'
import type { Candidate } from '../../../../../../shared/types/index'

const mockUseColumnCandidates = vi.fn()
vi.mock('../../../../candidates/hooks/useColumnCandidates', () => ({
  useColumnCandidates: (...args: unknown[]) => mockUseColumnCandidates(...args),
}))

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'c1', name: 'Alice', currentRole: 'Dev', avatarUrl: null,
    matchScore: 88, isDuplicate: false,
    appliedJob: { id: 'j1', title: 'Eng' }, applicationSource: 'Direct Upload',
    status: 'shortlisted', appliedDate: '',
    email: null, phone: null, linkedIn: null, gitHub: null,
    skills: null, experience: null, education: null,
    ...overrides,
  }
}

function mockReturn(overrides = {}) {
  return {
    data: { pages: [{ candidates: [candidate()], total: 1 }] },
    fetchNextPage: vi.fn(), hasNextPage: false, isFetchingNextPage: false, isLoading: false,
    ...overrides,
  }
}

describe('CandidateListPane', () => {
  beforeEach(() => {
    mockUseColumnCandidates.mockReset()
  })

  it('renders the stage label and total', () => {
    mockUseColumnCandidates.mockReturnValue(mockReturn())
    render(<CandidateListPane jobId="j1" selectedStage="shortlisted" onSelectStage={vi.fn()} selectedCandidateId={null} isMobile={false} onCandidateClick={vi.fn()} />)
    expect(screen.getByText('Shortlisted')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders skeletons while loading', () => {
    mockUseColumnCandidates.mockReturnValue(mockReturn({ data: undefined, isLoading: true }))
    const { container } = render(<CandidateListPane jobId="j1" selectedStage="shortlisted" onSelectStage={vi.fn()} selectedCandidateId={null} isMobile={false} onCandidateClick={vi.fn()} />)
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBeGreaterThan(0)
  })

  it('renders empty message when no candidates', () => {
    mockUseColumnCandidates.mockReturnValue(mockReturn({ data: { pages: [{ candidates: [], total: 0 }] } }))
    render(<CandidateListPane jobId="j1" selectedStage="shortlisted" onSelectStage={vi.fn()} selectedCandidateId={null} isMobile={false} onCandidateClick={vi.fn()} />)
    expect(screen.getByText(/No candidates in Shortlisted/)).toBeInTheDocument()
  })

  it('fires onCandidateClick when a row clicked', async () => {
    mockUseColumnCandidates.mockReturnValue(mockReturn())
    const onCandidateClick = vi.fn()
    render(<CandidateListPane jobId="j1" selectedStage="shortlisted" onSelectStage={vi.fn()} selectedCandidateId={null} isMobile={false} onCandidateClick={onCandidateClick} />)
    await userEvent.click(screen.getByText('Alice'))
    expect(onCandidateClick).toHaveBeenCalled()
  })

  it('shows Load more when hasNextPage', () => {
    mockUseColumnCandidates.mockReturnValue(mockReturn({ hasNextPage: true, data: { pages: [{ candidates: [candidate()], total: 5 }] } }))
    render(<CandidateListPane jobId="j1" selectedStage="shortlisted" onSelectStage={vi.fn()} selectedCandidateId={null} isMobile={false} onCandidateClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Load more/ })).toBeInTheDocument()
  })
})
