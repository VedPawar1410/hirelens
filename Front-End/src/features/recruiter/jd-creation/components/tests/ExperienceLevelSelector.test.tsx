import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExperienceLevelSelector } from '../ExperienceLevelSelector'

describe('ExperienceLevelSelector', () => {
  it('renders all 3 levels', () => {
    render(<ExperienceLevelSelector selected={null} onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Intern' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fresher' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Experienced' })).toBeInTheDocument()
  })

  it('fires onSelect with chosen level', async () => {
    const onSelect = vi.fn()
    render(<ExperienceLevelSelector selected={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Experienced' }))
    expect(onSelect).toHaveBeenCalledWith('experienced')
  })

  it('hides progress when no selection', () => {
    render(<ExperienceLevelSelector selected={null} onSelect={vi.fn()} fieldsFilled={1} fieldsTotal={5} />)
    expect(screen.queryByText(/fields/)).toBeNull()
  })

  it('shows progress when selected and fields specified', () => {
    render(<ExperienceLevelSelector selected="experienced" onSelect={vi.fn()} fieldsFilled={2} fieldsTotal={5} />)
    expect(screen.getByText('2/5 fields')).toBeInTheDocument()
  })

  it('uses success color when fields complete', () => {
    render(<ExperienceLevelSelector selected="experienced" onSelect={vi.fn()} fieldsFilled={5} fieldsTotal={5} />)
    expect(screen.getByText('5/5 fields')).toHaveStyle({ color: '#86efac' })
  })
})
