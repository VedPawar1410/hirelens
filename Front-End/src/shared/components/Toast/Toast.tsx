import { useEffect } from 'react'

export type ToastType = 'error' | 'success' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

const BORDER_L_CLASSES: Record<ToastType, string> = {
  error:   'border-l-[#ef4444]',
  success: 'border-l-[#22c55e]',
  info:    'border-l-[#3b82f6]',
}

interface Props {
  readonly toast: ToastItem
  readonly onRemove: (id: string) => void
}

export function Toast({ toast, onRemove }: Props) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onRemove])

  return (
    <div
      className={`bg-[#1f2937] border border-[#37373f] border-l-4 ${BORDER_L_CLASSES[toast.type]} rounded-[10px] py-3 px-4 text-[#e5e7eb] text-[13px] flex items-center justify-between gap-3 min-w-[280px] max-w-[380px] shadow-[0_4px_20px_rgba(0,0,0,0.4)]`}
    >
      <span>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="bg-transparent border-none text-[#6b7280] cursor-pointer text-base leading-none p-0 shrink-0 hover:text-white transition-colors duration-150"
      >
        ×
      </button>
    </div>
  )
}
