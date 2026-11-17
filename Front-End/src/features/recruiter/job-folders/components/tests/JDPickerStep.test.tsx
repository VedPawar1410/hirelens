import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JDPickerStep from '../JDPickerStep'
import type { JDDraft } from '../../../../../shared/types/index'

function jd(overrides: Partial<JDDraft> = {}): JDDraft {
  return {
    id: 'd1', experienceLevel: 'experienced', jobTitle: 'Engineer',
    location: 'Remote', workMode: 'Hybrid', workHours: '40',
    duration: '', stipendSalary: '', fulltimeOfferSalary: '',
    yearsOfExperience: '', noticePeriod: '', relevantExperience: '',
    roleDescription: '', generatedJd: '', assignedTo: [], interviewRounds: [],
    status: 'finalized', createdBy: 'rec1', createdAt: '',
    ...overrides,
  }
}

describe('JDPickerStep', () => {
  it('renders search input', () => {
    render(<JDPickerStep jds={[]} isLoading={false} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search job title…')).toBeInTheDocument()
  })

  it('shows empty message when no JDs', () => {
    render(<JDPickerStep jds={[]} isLoading={false} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText(/No published JDs yet/)).toBeInTheDocument()
  })

  it('renders JD cards with experience label', () => {
    render(<JDPickerStep jds={[jd()]} isLoading={false} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('Engineer')).toBeInTheDocument()
    expect(screen.getByText('Experienced')).toBeInTheDocument()
  })

  it('filters JDs by search text', async () => {
    render(<JDPickerStep jds={[jd({ jobTitle: 'Engineer' }), jd({ id: 'd2', jobTitle: 'Designer' })]} isLoading={false} selectedId={null} onSelect={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('Search job title…'), 'desi')
    expect(screen.getByText('Designer')).toBeInTheDocument()
    expect(screen.queryByText('Engineer')).toBeNull()
  })

  it('shows "no match" message when search excludes all', async () => {
    render(<JDPickerStep jds={[jd()]} isLoading={false} selectedId={null} onSelect={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('Search job title…'), 'zzz')
    expect(screen.getByText('No JDs match your search.')).toBeInTheDocument()
  })

  it('fires onSelect when a card clicked', async () => {
    const onSelect = vi.fn()
    const d = jd()
    render(<JDPickerStep jds={[d]} isLoading={false} selectedId={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('Engineer'))
    expect(onSelect).toHaveBeenCalledWith(d)
  })
})
