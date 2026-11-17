import { createContext, useCallback, useState, useEffect, useMemo } from 'react'
import { Toast } from './Toast'
import type { ToastItem, ToastType } from './Toast'

interface ToastContextValue {
  showToast: (message: string, type: ToastType) => void
}

// This file intentionally exports the context and provider together so the toast hook
// can consume a single source of truth without introducing an extra wrapper file.
// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString()
    setToasts((prev) => {
      const next = [...prev, { id, message, type }]
      return next.length > 3 ? next.slice(-3) : next
    })
  }, [])

  useEffect(() => {
    function handleExpired() {
      showToast('Your session expired. Please sign in again.', 'error')
      // Avoid router hooks here because ToastProvider sits above RouterProvider.
      globalThis.location.replace('/login')
    }
    globalThis.addEventListener('ats:session-expired', handleExpired)
    return () => globalThis.removeEventListener('ats:session-expired', handleExpired)
  }, [showToast])

  const contextValue = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-[10px]">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
