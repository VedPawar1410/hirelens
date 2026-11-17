export function BezelCard({ children, className = '' }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={`bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-[3px] ${className}`}>
      <div className="bg-[#161719] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] p-5 h-full">
        {children}
      </div>
    </div>
  )
}

export function SectionTitle({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6b7280] mb-4 mt-0">
      {children}
    </p>
  )
}
