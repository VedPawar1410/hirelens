import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LiveSummaryPanel } from '../LiveSummaryPanel'
import type { JDFormState } from '../types'

function form(overrides: Partial<JDFormState> = {}): JDFormState {
  return {
    experienceLevel: 'experienced',
    jobTitle: 'Eng', location: 'Remote', workMode: 'Hybrid', workHours: '40',
    duration: '', stipendSalary: '', fulltimeOfferSalary: '120000',
    yearsOfExperience: '5', noticePeriod: '30 days', relevantExperience: '',
    roleDescription: 'A great role', assignedTo: ['iv1'], interviewRounds: [],
    ...overrides,
  }
}

describe('LiveSummaryPanel', () => {
  it('renders header', () => {
    render(<LiveSummaryPanel form={form()} isComplete={false} fieldsFilled={0} fieldsTotal={0} />)
    expect(screen.getByText('Live Summary')).toBeInTheDocument()
  })

  it('renders main fields', () => {
    render(<LiveSummaryPanel form={form()} isComplete={false} fieldsFilled={5} fieldsTotal={10} />)
    expect(screen.getByText('Eng')).toBeInTheDocument()
    expect(screen.getByText('Experienced')).toBeInTheDocument()
    expect(screen.getByText('Remote')).toBeInTheDocument()
    expect(screen.getByText('Hybrid')).toBeInTheDocument()
  })

  it('shows ₹-prefixed salary for experienced', () => {
    render(<LiveSummaryPanel form={form()} isComplete={false} fieldsFilled={0} fieldsTotal={1} />)
    expect(screen.getByText('₹120000')).toBeInTheDocument()
  })

  it('shows assigned interviewer list joined by comma', () => {
    render(<LiveSummaryPanel form={form({ assignedTo: ['a', 'b'] })} isComplete={false} fieldsFilled={0} fieldsTotal={1} />)
    expect(screen.getByText('a, b')).toBeInTheDocument()
  })

  it('shows Ready when isComplete', () => {
    render(<LiveSummaryPanel form={form()} isComplete fieldsFilled={10} fieldsTotal={10} />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('shows percentage when not complete', () => {
    render(<LiveSummaryPanel form={form()} isComplete={false} fieldsFilled={3} fieldsTotal={10} />)
    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('shows em-dash for empty Job Title', () => {
    render(<LiveSummaryPanel form={form({ jobTitle: '' })} isComplete={false} fieldsFilled={0} fieldsTotal={1} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('renders intern-specific Duration field', () => {
    render(<LiveSummaryPanel form={form({ experienceLevel: 'intern', duration: '3 months' })} isComplete={false} fieldsFilled={0} fieldsTotal={1} />)
    expect(screen.getByText('3 months')).toBeInTheDocument()
  })
})
