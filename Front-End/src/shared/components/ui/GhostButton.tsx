interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // danger turns hover state red — used for destructive actions like delete/dismiss
  danger?: boolean
}

function getHoverClass(disabled: boolean | undefined, danger: boolean): string {
  if (disabled) return ''
  if (danger) return 'hover:bg-[rgba(239,68,68,0.1)] hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444]'
  return 'hover:bg-[#1a1d20]'
}

export function GhostButton({ danger = false, children, disabled, className, ...props }: Readonly<Props>) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={[
        'flex items-center justify-center gap-[6px] py-2 px-4 rounded-lg text-[13px] font-semibold text-[#e5e7eb] bg-transparent border border-[#37373f]',
        'transition-[background,color,border-color] duration-150 ease',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        getHoverClass(disabled, danger),
        className ?? '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
