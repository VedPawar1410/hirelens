import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PanelSelector } from '../PanelSelector'

describe('PanelSelector', () => {
  it('renders both panel buttons', () => {
    render(<PanelSelector selected={null} onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Recruitment Panel/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Interviewer Panel/ })).toBeInTheDocument()
  })

  it('emits "recruitment" when recruitment clicked', async () => {
    const onSelect = vi.fn()
    render(<PanelSelector selected={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /Recruitment Panel/ }))
    expect(onSelect).toHaveBeenCalledWith('recruitment')
  })

  it('emits "interviewer" when interviewer clicked', async () => {
    const onSelect = vi.fn()
    render(<PanelSelector selected={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /Interviewer Panel/ }))
    expect(onSelect).toHaveBeenCalledWith('interviewer')
  })

  it('applies active gradient classes when selected', () => {
    render(<PanelSelector selected="recruitment" onSelect={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /Recruitment Panel/ })
    expect(btn.className).toContain('linear-gradient(135deg,#1d2ba4')
  })
})
