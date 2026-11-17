import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JdCard } from '../JdCard'

vi.mock('../../../../../../shared/hooks/usePdfBlobUrl', () => ({
  usePdfBlobUrl: (b64: string | null) => (b64 ? 'blob:mock-url' : null),
}))

const appliedJob = { id: 'j1', title: 'Eng' }

describe('JdCard', () => {
  it('renders nothing when appliedJob is null', () => {
    const { container } = render(<JdCard appliedJob={null} jobDescBase64={null} jobDescFileName={null} jdData={undefined} jdIsLoading={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders header and "Loading…" while loading', () => {
    render(<JdCard appliedJob={appliedJob} jobDescBase64={null} jobDescFileName={null} jdData={undefined} jdIsLoading />)
    expect(screen.getByText('Job Description')).toBeInTheDocument()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders jdData fields when present', () => {
    render(<JdCard
      appliedJob={appliedJob}
      jobDescBase64={null} jobDescFileName={null}
      jdData={{ jobTitle: 'Eng', location: 'Remote', workMode: 'Hybrid', yearsOfExperience: '3-5', generatedJd: 'JD body' }}
      jdIsLoading={false}
    />)
    expect(screen.getByText('Remote')).toBeInTheDocument()
    expect(screen.getByText('Hybrid')).toBeInTheDocument()
    expect(screen.getByText('3-5 yrs exp')).toBeInTheDocument()
    expect(screen.getByText('JD body')).toBeInTheDocument()
  })

  it('renders fallback when no generatedJd or pdf', () => {
    render(<JdCard
      appliedJob={appliedJob}
      jobDescBase64={null} jobDescFileName={null}
      jdData={{ jobTitle: 'Eng' }}
      jdIsLoading={false}
    />)
    expect(screen.getByText('JD not yet generated for this role.')).toBeInTheDocument()
  })

  it('renders an iframe when PDF available', () => {
    const { container } = render(<JdCard
      appliedJob={appliedJob}
      jobDescBase64="abc" jobDescFileName="jd.pdf"
      jdData={{ jobTitle: 'Eng' }}
      jdIsLoading={false}
    />)
    expect(container.querySelector('iframe')).toBeTruthy()
  })

  it('renders Download link when PDF + filename', () => {
    render(<JdCard
      appliedJob={appliedJob}
      jobDescBase64="abc" jobDescFileName="jd.pdf"
      jdData={{ jobTitle: 'Eng' }}
      jdIsLoading={false}
    />)
    const link = screen.getByText('Download').closest('a')
    expect(link?.getAttribute('download')).toBe('jd.pdf')
  })

  it('shows error fallback when jdData undefined and not loading', () => {
    render(<JdCard appliedJob={appliedJob} jobDescBase64={null} jobDescFileName={null} jdData={undefined} jdIsLoading={false} />)
    expect(screen.getByText('Could not load job description.')).toBeInTheDocument()
  })
})
