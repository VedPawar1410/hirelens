interface Props {
  readonly children: React.ReactNode
  readonly required?: boolean
}

export function FieldLabel({ children, required }: Props) {
  return (
    <label className="flex items-center gap-1 text-xs font-medium text-[#9ca3af] mb-2">
      {children}
      {required && <span className="text-[#f87171]">*</span>}
    </label>
  )
}
