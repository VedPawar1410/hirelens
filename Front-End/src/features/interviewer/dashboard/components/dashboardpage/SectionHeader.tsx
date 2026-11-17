export function SectionHeader({ label, color = '#9ca3af', count }: Readonly<{ label: string; color?: string; count?: number }>) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color }}>
        {label}
      </span>
      {count !== undefined && (
        <span
          className="text-[10px] font-bold px-1.75 py-0.5 rounded-full min-w-4.5 text-center leading-none"
          style={{ color, background: color + '20' }}
        >
          {count}
        </span>
      )}
    </div>
  )
}
