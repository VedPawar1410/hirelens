import React, { useState, useId, useRef, useEffect } from 'react'
import type { ApplicationVolumeDay } from '../../../../shared/types'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'
import { ChartSvg } from './ChartSvg'

type Period = '7d' | '30d' | '90d'

interface ApplicationVolumeChartProps {
  readonly data: ApplicationVolumeDay[]
  readonly isLoading: boolean
  readonly period: Period
  readonly onPeriodChange: (p: Period) => void
}

export default function ApplicationVolumeChart({
  data,
  isLoading,
  period,
  onPeriodChange,
}: ApplicationVolumeChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const uid = useId().replaceAll(':', '')
  const { isCompact: isMobile } = useBreakpoints()

  const lineRef = useRef<SVGPathElement>(null)
  const [svgSize, setSvgSize] = useState({ w: 0, h: 280 })
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null)

  const animKey = `${data.length}-${svgSize.w}`

  // Callback ref: observer sets up whenever the container div actually mounts
  // (useRef + [] effect misses the mount when isLoading=true hides the div initially)
  useEffect(() => {
    if (!containerNode) return
    const ro = new ResizeObserver(entries => {
      const { width: w, height: h } = entries[0].contentRect
      if (w > 0 && h > 0) setSvgSize({ w: Math.round(w), h: Math.round(h) })
    })
    ro.observe(containerNode)
    return () => ro.disconnect()
  }, [containerNode])

  useEffect(() => {
    const path = lineRef.current
    if (!path) return
    const len = path.getTotalLength()
    path.style.transition = 'none'
    path.style.strokeDasharray = `${len}`
    path.style.strokeDashoffset = `${len}`
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.16, 1, 0.3, 1)'
        path.style.strokeDashoffset = '0'
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [data, svgSize])

  const totalApps = data.reduce((s, d) => s + d.apps, 0)

  let chartContent: React.ReactNode
  if (isLoading) {
    chartContent = (
      <div className="flex-1 min-h-0 flex flex-col justify-end gap-2 pt-4">
        <div className="skeleton-shimmer h-24 rounded-xl" />
        <div className="flex justify-between mt-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-shimmer w-10 h-2.5 rounded" />
          ))}
        </div>
      </div>
    )
  } else if (data.length === 0) {
    chartContent = (
      <div className="flex-1 min-h-0 flex items-center justify-center text-[#3d4149] text-[13px]">
        No data for this period.
      </div>
    )
  } else {
    chartContent = (
      <div ref={setContainerNode} className="flex-1 min-h-0 overflow-hidden" style={{ minHeight: 180 }}>
        {svgSize.w > 0 && (
          <ChartSvg
            uid={uid}
            data={data}
            svgSize={svgSize}
            isMobile={isMobile}
            hoveredIndex={hoveredIndex}
            animKey={animKey}
            lineRef={lineRef}
            onHoverChange={setHoveredIndex}
          />
        )}
      </div>
    )
  }

  return (
    <div
      className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-0.75 flex flex-col box-border"
      style={{ height: '100%' }}
    >
      <div
        className="[background:linear-gradient(160deg,#14161b_0%,#111318_100%)] border border-[#1e2028] rounded-2xl px-6 pt-5 pb-4 flex-1 flex flex-col box-border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden"
        style={{ minHeight: 0 }}
      >
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            width: 560, height: 220, top: -80, left: '15%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.11) 0%, transparent 70%)',
            filter: 'blur(60px)', borderRadius: '50%',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            width: 300, height: 180, bottom: 20, right: '5%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)',
            filter: 'blur(48px)', borderRadius: '50%',
          }}
        />

        <div className="flex justify-between items-start mb-4 relative shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h3
                className="font-semibold text-[#6b7280] m-0 tracking-[0.07em] uppercase"
                style={{ fontSize: isMobile ? 9 : 11 }}
              >
                Application Volume
              </h3>
              {!isMobile && (
                <>
                  <div className="w-0.75 h-0.75 rounded-full bg-[#2a2d35]" />
                  <span className="text-[11px] text-[#3d4149]">LinkedIn &amp; Direct</span>
                </>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="font-bold text-white leading-none"
                style={{ fontSize: isMobile ? 22 : 30, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}
              >
                {totalApps.toLocaleString()}
              </span>
              <span className="text-[#4b5563]" style={{ fontSize: isMobile ? 10 : 12 }}>
                total applications
              </span>
            </div>
          </div>

          <div
            className="flex gap-0.5 rounded-[10px] p-0.75 border border-[#1e2028]"
            style={{ background: 'rgba(0,0,0,0.35)' }}
          >
            {(['7d', '30d', '90d'] as const).map(p => {
              const active = p === period
              const periodLabel: Record<Period, string> = { '7d': '7D', '30d': '30D', '90d': '90D' }
              return (
                <button
                  key={p}
                  onClick={() => onPeriodChange(p)}
                  className="rounded-[7px] cursor-pointer border transition-all duration-200"
                  style={{
                    fontSize: 11,
                    padding: isMobile ? '3px 8px' : '4px 12px',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : '#4b5563',
                    background: active ? 'rgba(99,102,241,0.42)' : 'transparent',
                    borderColor: active ? 'rgba(99,102,241,0.48)' : 'transparent',
                    boxShadow: active
                      ? '0 0 14px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                      : 'none',
                  }}
                >
                  {periodLabel[p]}
                </button>
              )
            })}
          </div>
        </div>

        <div
          className="shrink-0 mb-3"
          style={{ height: 1, background: 'linear-gradient(90deg, transparent, #1e2028 20%, #1e2028 80%, transparent)' }}
        />

        {chartContent}
      </div>
    </div>
  )
}
