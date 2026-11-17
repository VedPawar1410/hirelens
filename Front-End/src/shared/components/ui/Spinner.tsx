const SIZE_CLASSES = {
  sm: 'w-3 h-3',
  md: 'w-[14px] h-[14px]',
  lg: 'w-[18px] h-[18px]',
} as const

interface Props {
  readonly size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ size = 'md' }: Props) {
  return (
    <output
      aria-label="Loading"
      className={`btn-spinner ${SIZE_CLASSES[size]}`}
    />
  )
}
