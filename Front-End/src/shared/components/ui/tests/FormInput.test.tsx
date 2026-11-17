import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormInput } from '../FormInput'

describe('FormInput', () => {
  it('renders an input', () => {
    render(<FormInput placeholder="Name" />)
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
  })

  it('shows the error message when error provided', () => {
    render(<FormInput error="Required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
  })

  it('omits the error element when error not provided', () => {
    render(<FormInput />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('applies the error border class when error set', () => {
    render(<FormInput error="x" data-testid="i" />)
    expect(screen.getByTestId('i').className).toContain('#ef4444')
  })

  it('fires onChange as user types', async () => {
    const onChange = vi.fn()
    render(<FormInput onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'hi')
    expect(onChange).toHaveBeenCalled()
  })

  it('forwards type and value props', () => {
    render(<FormInput type="email" value="a@b.c" onChange={() => undefined} />)
    expect(screen.getByDisplayValue('a@b.c')).toHaveAttribute('type', 'email')
  })
})
