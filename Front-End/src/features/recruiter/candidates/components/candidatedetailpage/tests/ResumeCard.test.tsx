import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResumeCard } from '../ResumeCard'

vi.mock('../../../../../../shared/hooks/usePdfBlobUrl', () => ({
  usePdfBlobUrl: (b64: string | null) => (b64 ? 'blob:mock' : null),
}))

describe('ResumeCard', () => {
  it('renders header', () => {
    render(<ResumeCard resumeBase64={null} resumeFileName={null} />)
    expect(screen.getByText('Resume')).toBeInTheDocument()
  })

  it('renders empty state when no resume', () => {
    render(<ResumeCard resumeBase64={null} resumeFileName={null} />)
    expect(screen.getByText('No resume available.')).toBeInTheDocument()
  })

  it('renders an iframe when PDF available', () => {
    const { container } = render(<ResumeCard resumeBase64="abc" resumeFileName="r.pdf" />)
    expect(container.querySelector('iframe')).toBeTruthy()
  })

  it('renders Download link with filename when PDF', () => {
    render(<ResumeCard resumeBase64="abc" resumeFileName="r.pdf" />)
    const a = screen.getByText('Download').closest('a')
    expect(a?.getAttribute('download')).toBe('r.pdf')
  })
})
