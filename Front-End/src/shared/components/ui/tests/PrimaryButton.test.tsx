import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrimaryButton } from '../PrimaryButton'

describe('PrimaryButton', () => {
  it('renders children', () => {
    render(<PrimaryButton>Sign In</PrimaryButton>)
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('fires onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<PrimaryButton onClick={onClick}>Go</PrimaryButton>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when loading=true', () => {
    render(<PrimaryButton loading>X</PrimaryButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when disabled=true', () => {
    render(<PrimaryButton disabled>X</PrimaryButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows loadingText instead of children when loading', () => {
    render(<PrimaryButton loading loadingText="Signing in…">Sign In</PrimaryButton>)
    expect(screen.getByRole('button')).toHaveTextContent('Signing in…')
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
  })

  it('renders a spinner when loading', () => {
    render(<PrimaryButton loading>X</PrimaryButton>)
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('appends provided className', () => {
    render(<PrimaryButton className="custom-x">X</PrimaryButton>)
    expect(screen.getByRole('button').className).toContain('custom-x')
  })

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn()
    render(<PrimaryButton disabled onClick={onClick}>X</PrimaryButton>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
