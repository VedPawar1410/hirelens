import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { useToast } from '../useToast'
import { ToastContext } from '../../components/Toast/ToastProvider'

describe('useToast', () => {
  it('throws when used outside a ToastProvider', () => {
    expect(() => renderHook(() => useToast())).toThrow(/useToast must be used inside ToastProvider/)
  })

  it('returns showToast from the surrounding provider', () => {
    const showToast = vi.fn()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ToastContext.Provider value={{ showToast }}>{children}</ToastContext.Provider>
    )
    const { result } = renderHook(() => useToast(), { wrapper })
    expect(result.current.showToast).toBe(showToast)
  })

  it('forwards calls to the provider showToast', () => {
    const showToast = vi.fn()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ToastContext.Provider value={{ showToast }}>{children}</ToastContext.Provider>
    )
    const { result } = renderHook(() => useToast(), { wrapper })
    result.current.showToast('hello', 'success')
    expect(showToast).toHaveBeenCalledWith('hello', 'success')
  })
})
