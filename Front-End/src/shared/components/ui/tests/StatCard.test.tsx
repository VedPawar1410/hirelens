import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatCard } from '../StatCard'

describe('StatCard', () => {
  it('renders icon, value, and label', () => {
    render(<StatCard icon={<svg data-testid="icon" />} iconBg="#000" value={42} label="Active jobs" />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Active jobs')).toBeInTheDocument()
  })

  it('formats numeric value via toLocaleString (renders comma separators)', () => {
    render(<StatCard icon={null} iconBg="" value={1234567} label="x" />)
    // The exact format depends on the test runtime's default locale (jsdom may
    // pick Indian formatting "12,34,567" vs en-US "1,234,567"). Both contain commas.
    expect(screen.getByText((1234567).toLocaleString())).toBeInTheDocument()
  })

  it('renders string value unchanged', () => {
    render(<StatCard icon={null} iconBg="" value="3.5K" label="x" />)
    expect(screen.getByText('3.5K')).toBeInTheDocument()
  })

  it('renders a skeleton when value is null', () => {
    const { container } = render(<StatCard icon={null} iconBg="" value={null} label="x" />)
    expect(container.querySelector('.skeleton-shimmer')).not.toBeNull()
  })

  it('uses a button (clickable) when onClick provided', () => {
    const onClick = vi.fn()
    render(<StatCard icon={null} iconBg="" value={1} label="x" onClick={onClick} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('fires onClick when the card is clicked', async () => {
    const onClick = vi.fn()
    render(<StatCard icon={null} iconBg="" value={1} label="x" onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders a div (no button role) when onClick omitted', () => {
    render(<StatCard icon={null} iconBg="" value={1} label="x" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('applies hover transform when onClick provided and mouse enters', () => {
    const onClick = vi.fn()
    render(<StatCard icon={null} iconBg="" value={1} label="x" onClick={onClick} />)
    const btn = screen.getByRole('button')
    fireEvent.mouseEnter(btn)
    expect(btn.style.transform).toContain('translateY(-2px)')
    fireEvent.mouseLeave(btn)
    expect(btn.style.transform).toContain('translateY(0)')
  })
})
