import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormSelect } from '../FormSelect'

describe('FormSelect', () => {
  it('renders option children', () => {
    render(
      <FormSelect>
        <option value="a">Apple</option>
        <option value="b">Banana</option>
      </FormSelect>,
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument()
  })

  it('shows error message when error provided', () => {
    render(
      <FormSelect error="Pick one">
        <option value="">--</option>
      </FormSelect>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Pick one')
  })

  it('fires onChange when selection changes', async () => {
    const onChange = vi.fn()
    render(
      <FormSelect onChange={onChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </FormSelect>,
    )
    await userEvent.selectOptions(screen.getByRole('combobox'), 'b')
    expect(onChange).toHaveBeenCalled()
  })
})
