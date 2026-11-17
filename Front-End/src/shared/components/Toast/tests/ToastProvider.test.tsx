import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import { useContext } from 'react'
import { ToastContext, ToastProvider } from '../ToastProvider'

describe('ToastProvider', () => {
  const replaceMock = vi.fn()
  const originalLocation = globalThis.location

  beforeEach(() => {
    replaceMock.mockReset()
    // jsdom won't let us spy on location.replace directly; swap the whole object
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { ...originalLocation, replace: replaceMock },
    })
  })
  afterEach(() => {
    Object.defineProperty(globalThis, 'location', { configurable: true, value: originalLocation })
  })

  it('renders children', () => {
    render(<ToastProvider><div>hi</div></ToastProvider>)
    expect(screen.getByText('hi')).toBeInTheDocument()
  })

  it('shows a toast added via showToast', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <ToastProvider>{children}</ToastProvider>
    const { result } = renderHook(() => useContext(ToastContext)!, { wrapper })
    act(() => { result.current.showToast('hello world', 'success') })
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('caps visible toasts at 3 (oldest dropped)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <ToastProvider>{children}</ToastProvider>
    const { result } = renderHook(() => useContext(ToastContext)!, { wrapper })
    act(() => { result.current.showToast('one', 'info') })
    act(() => { result.current.showToast('two', 'info') })
    act(() => { result.current.showToast('three', 'info') })
    act(() => { result.current.showToast('four', 'info') })
    expect(screen.queryByText('one')).toBeNull()
    expect(screen.getByText('four')).toBeInTheDocument()
  })

  it('handles ats:session-expired by showing a toast and redirecting', () => {
    render(<ToastProvider><div /></ToastProvider>)
    act(() => {
      globalThis.dispatchEvent(new Event('ats:session-expired'))
    })
    expect(screen.getByText('Your session expired. Please sign in again.')).toBeInTheDocument()
    expect(replaceMock).toHaveBeenCalledWith('/login')
  })
})
