interface Props {
  readonly icon: React.ElementType
  readonly text: string
}

export function SectionLabel({ icon: Icon, text }: Props) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[rgba(29,43,164,0.18)] border border-[rgba(29,43,164,0.35)] flex items-center justify-center shrink-0">
        <Icon className="w-[13px] h-[13px] text-[#6ea8fe]" />
      </div>
      <span className="text-xs font-semibold text-[#9ca3af]">{text}</span>
    </div>
  )
}
