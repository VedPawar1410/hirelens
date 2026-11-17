import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast } from '../Toast'

const TOAST_ID = '1'
const TOAST_MSG = 'x'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the message', () => {
    render(<Toast toast={{ id: TOAST_ID, message: 'Saved!', type: 'success' }} onRemove={vi.fn()} />)
    expect(screen.getByText('Saved!')).toBeInTheDocument()
  })

  it('applies green border for success', () => {
    const { container } = render(<Toast toast={{ id: TOAST_ID, message: TOAST_MSG, type: 'success' }} onRemove={vi.fn()} />)
    expect((container.firstChild as HTMLElement).className).toContain('border-l-[#22c55e]')
  })

  it('applies red border for error', () => {
    const { container } = render(<Toast toast={{ id: TOAST_ID, message: TOAST_MSG, type: 'error' }} onRemove={vi.fn()} />)
    expect((container.firstChild as HTMLElement).className).toContain('border-l-[#ef4444]')
  })

  it('applies blue border for info', () => {
    const { container } = render(<Toast toast={{ id: TOAST_ID, message: TOAST_MSG, type: 'info' }} onRemove={vi.fn()} />)
    expect((container.firstChild as HTMLElement).className).toContain('border-l-[#3b82f6]')
  })

  it('auto-removes after 4 seconds', () => {
    const onRemove = vi.fn()
    render(<Toast toast={{ id: TOAST_ID, message: TOAST_MSG, type: 'info' }} onRemove={onRemove} />)
    act(() => { vi.advanceTimersByTime(4000) })
    expect(onRemove).toHaveBeenCalledWith(TOAST_ID)
  })

  it('removes on close button click', async () => {
    vi.useRealTimers()
    const onRemove = vi.fn()
    render(<Toast toast={{ id: 'abc', message: TOAST_MSG, type: 'info' }} onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onRemove).toHaveBeenCalledWith('abc')
  })

  it('clears the auto-dismiss timer on unmount', () => {
    const onRemove = vi.fn()
    const { unmount } = render(<Toast toast={{ id: TOAST_ID, message: TOAST_MSG, type: 'info' }} onRemove={onRemove} />)
    unmount()
    act(() => { vi.advanceTimersByTime(4000) })
    expect(onRemove).not.toHaveBeenCalled()
  })
})
