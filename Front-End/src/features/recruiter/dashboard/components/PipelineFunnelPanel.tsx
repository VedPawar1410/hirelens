import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import type { PipelineFunnel } from '../api/dashboardApi'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'

const STAGE_COLORS = [
  { bar: 'rgba(99,102,241,0.7)',  glow: 'rgba(99,102,241,0.2)',  text: '#a5b4fc' },
  { bar: 'rgba(139,92,246,0.7)',  glow: 'rgba(139,92,246,0.2)',  text: '#c4b5fd' },
  { bar: 'rgba(59,130,246,0.7)',  glow: 'rgba(59,130,246,0.2)',  text: '#93c5fd' },
  { bar: 'rgba(14,165,233,0.7)',  glow: 'rgba(14,165,233,0.2)',  text: '#7dd3fc' },
  { bar: 'rgba(20,184,166,0.65)', glow: 'rgba(20,184,166,0.18)', text: '#5eead4' },
  { bar: 'rgba(34,197,94,0.65)',  glow: 'rgba(34,197,94,0.18)',  text: '#86efac' },
]

const SKELETON_STAGE_KEYS = ['sk-0', 'sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const

interface Props {
  readonly data: PipelineFunnel | undefined
  readonly isLoading: boolean
  readonly onDetailsClick?: () => void
}

export default function PipelineFunnelPanel({ data, isLoading, onDetailsClick }: Props) {
  const { isCompact: isMobile } = useBreakpoints()

  const stages = data?.stages ?? []
  const maxCount = Math.max(...stages.map(s => s.count), 1)

  return (
    <div
      className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-0.75 flex flex-col box-border"
      style={{ height: '100%' }}
    >
      <div
        className="bg-[#161719] rounded-2xl flex-1 flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] overflow-hidden"
        style={{ minHeight: 0 }}
      >
        {/* Header */}
        <div className={`flex justify-between items-center border-b border-[#37373f] shrink-0 ${isMobile ? 'px-4 py-2.5' : 'px-5 py-3'}`}>
          <span
            className="font-semibold text-[#6b7280] tracking-[0.07em] uppercase"
            style={{ fontSize: 11 }}
          >
            Pipeline
          </span>
          <button
            onClick={onDetailsClick}
            className="bg-transparent border-none text-[#6ea8fe] text-[12px] font-medium cursor-pointer flex items-center gap-0.75 hover:text-[#93c5fd] transition-colors duration-150"
          >
            Details
            <ArrowUpRight size={12} />
          </button>
        </div>

        {/* Stages */}
        <div className={`flex-1 flex flex-col justify-center ${isMobile ? 'px-4 py-3 gap-2.5' : 'px-5 py-4 gap-2.75'}`}>
          {(() => {
            if (isLoading) {
              return SKELETON_STAGE_KEYS.map((key, i) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="skeleton-shimmer rounded w-18 h-2.5 shrink-0" />
                  <div className="skeleton-shimmer rounded flex-1 h-2" style={{ opacity: 0.6 - i * 0.07 }} />
                  <div className="skeleton-shimmer rounded w-6 h-2.5 shrink-0" />
                </div>
              ))
            }
            if (stages.length === 0) {
              return <div className="text-[#6b7280] text-[13px] text-center py-4">No pipeline data</div>
            }
            return stages.map((stage, i) => {
              const color = STAGE_COLORS[i % STAGE_COLORS.length]
              const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
              return (
                <div key={stage.stage} className="flex items-center gap-2.5">
                  <span
                    className="shrink-0 text-[#9ca3af]"
                    style={{ fontSize: 11, width: 70, textAlign: 'right' }}
                  >
                    {stage.label}
                  </span>
                  <div className="flex-1 relative h-1.75 rounded-full bg-[rgba(255,255,255,0.04)]">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: color.bar,
                        boxShadow: `0 0 8px ${color.glow}`,
                        transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                      }}
                    />
                  </div>
                  <span
                    className="shrink-0 font-semibold tabular-nums"
                    style={{ fontSize: 12, color: color.text, minWidth: 28, textAlign: 'right' }}
                  >
                    {stage.count}
                  </span>
                </div>
              )
            })
          })()}
        </div>

        {/* Footer stat */}
        {!isLoading && data && (
          <div className={`border-t border-[#37373f] shrink-0 flex items-center gap-1.5 ${isMobile ? 'px-4 py-2.5' : 'px-5 py-2.5'}`}>
            <CheckCircle2 size={13} className="text-[#22c55e] shrink-0" />
            <span className="text-[12px] text-[#6b7280]">
              Selected rate{' '}
              <span className="text-[#22c55e] font-semibold">{data.selectedRate}%</span>
              {data.avgCycleDays > 0 && (
                <>
                  {' '}
                  <span className="text-[#37373f]">•</span>
                  {' cycle '}
                  <span className="text-[#9ca3af] font-medium">{data.avgCycleDays}d</span>
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
