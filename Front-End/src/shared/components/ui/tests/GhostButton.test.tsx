import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GhostButton } from '../GhostButton'

describe('GhostButton', () => {
  it('renders children', () => {
    render(<GhostButton>Cancel</GhostButton>)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('fires onClick', async () => {
    const onClick = vi.fn()
    render(<GhostButton onClick={onClick}>X</GhostButton>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies danger hover classes when danger=true', () => {
    render(<GhostButton danger>Delete</GhostButton>)
    expect(screen.getByRole('button').className).toContain('rgba(239,68,68,0.1)')
  })

  it('omits danger hover when default', () => {
    render(<GhostButton>X</GhostButton>)
    expect(screen.getByRole('button').className).not.toContain('rgba(239,68,68,0.1)')
  })

  it('is disabled and not clickable when disabled', async () => {
    const onClick = vi.fn()
    render(<GhostButton disabled onClick={onClick}>X</GhostButton>)
    expect(screen.getByRole('button')).toBeDisabled()
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not apply hover classes when disabled (even with danger)', () => {
    render(<GhostButton disabled danger>X</GhostButton>)
    expect(screen.getByRole('button').className).not.toContain('hover:bg-')
  })

  it('passes through type attribute', () => {
    render(<GhostButton type="submit">Submit</GhostButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
