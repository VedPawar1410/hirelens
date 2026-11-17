import { Sparkles } from 'lucide-react'

interface Props {
  readonly isVisible: boolean
  readonly jobTitle?: string
}

export function JDGeneratingOverlay({ isVisible, jobTitle }: Props) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-9999 bg-[rgba(10,11,12,0.88)] [backdrop-filter:blur(18px)] [-webkit-backdrop-filter:blur(18px)] flex items-center justify-center animate-[overlay-fade-in_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
      <div className="flex flex-col items-center gap-8 text-center max-w-95 px-7 animate-[content-rise_0.5s_cubic-bezier(0.16,1,0.3,1)_0.08s_both]">
        {/* Icon with orbital rings */}
        <div className="relative w-24 h-24">
          {/* Ambient glow halo */}
          <div className="absolute [-inset:28px] rounded-full pointer-events-none [background:radial-gradient(circle,rgba(29,43,164,0.2)_0%,transparent_68%)]" />
          {/* Fast inner orbit */}
          <div
            className="absolute rounded-full animate-[spin-smooth_1.6s_linear_infinite]"
            style={{
              inset: '-10px',
              border: '1.5px solid transparent',
              borderTopColor: 'rgba(110,168,254,0.75)',
              borderRightColor: 'rgba(110,168,254,0.2)',
            }}
          />
          {/* Slow outer orbit */}
          <div
            className="absolute rounded-full animate-[spin-smooth_5s_linear_infinite_reverse]"
            style={{ inset: '-20px', border: '1px dashed rgba(29,43,164,0.35)' }}
          />
          {/* Icon circle */}
          <div className="w-24 h-24 rounded-full [background:linear-gradient(145deg,#1d2ba4_0%,#0d1870_100%)] border border-[rgba(110,168,254,0.22)] flex items-center justify-center animate-[glow-pulse_2.2s_ease-in-out_infinite]">
            <Sparkles className="w-9.5 h-9.5 text-white" />
          </div>
        </div>

        {/* Text block */}
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[22px] font-bold text-[#f9fafb] m-0 tracking-[-0.02em]">
            Generating your JD
          </h2>
          {jobTitle && (
            <p className="text-sm text-[#6ea8fe] m-0 font-medium tracking-[0.005em]">
              {jobTitle}
            </p>
          )}
        </div>

        {/* Animated dots */}
        <div className="flex gap-1.75 items-center">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: i === 2 ? '9px' : '6px',
                height: i === 2 ? '9px' : '6px',
                background: i === 2 ? '#6ea8fe' : 'rgba(110,168,254,0.55)',
                animation: `generating-dot 1.6s ease-in-out ${i * 0.16}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Subtext */}
        <p className="text-[13px] text-[#6b7280] m-0 leading-[1.65]">
          AI is crafting a tailored description.
          <br />
          This usually takes 10–20 seconds.
        </p>
      </div>
    </div>
  )
}
