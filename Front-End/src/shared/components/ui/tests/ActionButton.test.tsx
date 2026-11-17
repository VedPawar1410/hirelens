import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionButton } from '../ActionButton'

const PRIMARY = 'primary'
const noop = () => undefined

describe('ActionButton', () => {
  it('renders the label as button text', () => {
    render(<ActionButton label="Apply" onClick={noop} variant={PRIMARY} />)
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<ActionButton label="Apply" onClick={onClick} variant={PRIMARY} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('uses primary classes for primary variant', () => {
    render(<ActionButton label="X" onClick={noop} variant={PRIMARY} />)
    expect(screen.getByRole('button').className).toContain('rgba(29,43,164,0.15)')
  })

  it('uses ghost classes for ghost variant', () => {
    render(<ActionButton label="X" onClick={noop} variant="ghost" />)
    expect(screen.getByRole('button').className).toContain('text-[#9ca3af]')
  })

  it('applies inline style override', () => {
    render(<ActionButton label="X" onClick={noop} variant={PRIMARY} style={{ marginTop: 12 }} />)
    expect(screen.getByRole('button')).toHaveStyle({ marginTop: '12px' })
  })
})
