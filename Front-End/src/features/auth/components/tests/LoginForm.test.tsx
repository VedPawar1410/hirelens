import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../LoginForm'

describe('LoginForm', () => {
  it('renders username, password, sign-in button', () => {
    render(<LoginForm loading={false} disabled={false} error="" onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/ })).toBeInTheDocument()
  })

  it('submits username + password on form submit', async () => {
    const onSubmit = vi.fn()
    render(<LoginForm loading={false} disabled={false} error="" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText('Username'), 'alice')
    await userEvent.type(screen.getByLabelText('Password'), 'pw')
    await userEvent.click(screen.getByRole('button', { name: /Sign In/ }))
    expect(onSubmit).toHaveBeenCalledWith('alice', 'pw')
  })

  it('toggles password visibility', async () => {
    render(<LoginForm loading={false} disabled={false} error="" onSubmit={vi.fn()} />)
    const pw = screen.getByLabelText('Password') as HTMLInputElement
    expect(pw.type).toBe('password')
    await userEvent.click(screen.getByLabelText('Show password'))
    expect(pw.type).toBe('text')
    await userEvent.click(screen.getByLabelText('Hide password'))
    expect(pw.type).toBe('password')
  })

  it('renders error message when error prop is set', () => {
    render(<LoginForm loading={false} disabled={false} error="Bad credentials" onSubmit={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Bad credentials')
  })

  it('disables submit when loading', () => {
    render(<LoginForm loading disabled={false} error="" onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Signing in/ })).toBeDisabled()
  })

  it('disables submit when disabled=true', () => {
    render(<LoginForm loading={false} disabled error="" onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Sign In/ })).toBeDisabled()
  })
})
