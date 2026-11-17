interface ActionButtonProps {
  readonly label: string
  readonly onClick: () => void
  readonly variant: 'primary' | 'ghost'
  readonly style?: React.CSSProperties
  readonly disabled?: boolean
}

export function ActionButton({ label, onClick, variant, style, disabled }: ActionButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <button
      onClick={onClick}
      style={style}
      disabled={disabled}
      className={[
        'py-1.25 px-2.5 rounded-md text-xs font-medium whitespace-nowrap border',
        'transition-[background,color] duration-150 ease',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        isPrimary
          ? 'border-[rgba(29,43,164,0.4)] bg-[rgba(29,43,164,0.15)] text-[#6ea8fe] hover:bg-[rgba(29,43,164,0.35)] hover:text-white'
          : 'border-[#37373f] bg-transparent text-[#9ca3af] hover:bg-[rgba(255,255,255,0.04)]',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
