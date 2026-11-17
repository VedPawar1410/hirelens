import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JDFormFields } from '../JDFormFields'
import type { JDFormState } from '../types'

function form(overrides: Partial<JDFormState> = {}): JDFormState {
  return {
    experienceLevel: 'experienced',
    jobTitle: '', location: '', workMode: '', workHours: '',
    duration: '', stipendSalary: '', fulltimeOfferSalary: '',
    yearsOfExperience: '', noticePeriod: '', relevantExperience: '',
    roleDescription: '', assignedTo: [], interviewRounds: [],
    ...overrides,
  }
}

describe('JDFormFields', () => {
  it('renders Job Title input', () => {
    render(<JDFormFields form={form()} setField={vi.fn()} fieldErrors={{}} />)
    expect(screen.getByPlaceholderText(/Frontend Developer/)).toBeInTheDocument()
  })

  it('emits setField when Job Title typed', async () => {
    const setField = vi.fn()
    render(<JDFormFields form={form()} setField={setField} fieldErrors={{}} />)
    await userEvent.type(screen.getByPlaceholderText(/Frontend Developer/), 'x')
    expect(setField).toHaveBeenCalledWith('jobTitle', 'x')
  })

  it('renders Duration field for intern level only', () => {
    render(<JDFormFields form={form({ experienceLevel: 'intern' })} setField={vi.fn()} fieldErrors={{}} />)
    expect(screen.getByPlaceholderText(/3 months/)).toBeInTheDocument()
  })

  it('hides Duration for experienced', () => {
    render(<JDFormFields form={form()} setField={vi.fn()} fieldErrors={{}} />)
    expect(screen.queryByPlaceholderText(/3 months/)).toBeNull()
  })

  it('renders Experience Years field for experienced', () => {
    render(<JDFormFields form={form()} setField={vi.fn()} fieldErrors={{}} />)
    expect(screen.getByPlaceholderText(/3\+ years/)).toBeInTheDocument()
  })

  it('renders Stipend + FT salary fields for intern', () => {
    render(<JDFormFields form={form({ experienceLevel: 'intern' })} setField={vi.fn()} fieldErrors={{}} />)
    expect(screen.getByPlaceholderText('e.g. 50000')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. 600000')).toBeInTheDocument()
  })

  it('shows fresher single salary field', () => {
    render(<JDFormFields form={form({ experienceLevel: 'fresher' })} setField={vi.fn()} fieldErrors={{}} />)
    expect(screen.getByPlaceholderText('e.g. 600000')).toBeInTheDocument()
  })

  it('renders job title error when present', () => {
    render(<JDFormFields form={form()} setField={vi.fn()} fieldErrors={{ jobTitle: 'Required' }} />)
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('renders role description error inline', () => {
    render(<JDFormFields form={form()} setField={vi.fn()} fieldErrors={{ roleDescription: 'Too short' }} />)
    expect(screen.getByText('Too short')).toBeInTheDocument()
  })
})
