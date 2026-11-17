import type { ApplicationVolumeDay } from '../../../../shared/types'
import { MARGIN, niceMax, smoothPath, labelStep } from './chartMath'

interface ChartSvgProps {
  readonly uid: string
  readonly data: ApplicationVolumeDay[]
  readonly svgSize: { w: number; h: number }
  readonly isMobile: boolean
  readonly hoveredIndex: number | null
  readonly animKey: string
  readonly lineRef: React.RefObject<SVGPathElement | null>
  readonly onHoverChange: (i: number | null) => void
}

export function ChartSvg({ uid, data, svgSize, isMobile, hoveredIndex, animKey, lineRef, onHoverChange }: ChartSvgProps) {
  const SVG_W = svgSize.w
  const SVG_H = svgSize.h
  const CHART_W = SVG_W - MARGIN.left - MARGIN.right
  const CHART_H = SVG_H - MARGIN.top - MARGIN.bottom

  const maxVal = niceMax(Math.max(...data.map(d => d.apps), 1))
  // Rounded quarter marks collide when maxVal is small (empty dashboard: 1, 1, 2, 2),
  // which drew overlapping labels and gave React duplicate keys. Keep each value once.
  const gridLines = [...new Set([0.25, 0.5, 0.75, 1].map(r => Math.round(maxVal * r)))]
  const n = data.length
  const spacing = n > 1 ? CHART_W / (n - 1) : CHART_W
  const step = labelStep(n)

  function ptX(i: number) { return MARGIN.left + i * spacing }
  function ptY(val: number) { return MARGIN.top + CHART_H - (val / maxVal) * CHART_H }

  const points: [number, number][] = data.map((d, i) => [ptX(i), ptY(d.apps)])
  const chartBottom = MARGIN.top + CHART_H

  const linePath = smoothPath(points, chartBottom)
  const last = points.at(-1)!
  const first = points[0]
  const areaPath = points.length > 0
    ? `${linePath} L ${last[0].toFixed(1)},${chartBottom} L ${first[0].toFixed(1)},${chartBottom} Z`
    : ''

  const peakIndex = data.reduce((best, d, i) => d.apps > data[best].apps ? i : best, 0)
  const peakPoint = points[peakIndex]
  const peakDay = data[peakIndex]

  const avgVal = data.length > 0 ? data.reduce((s, d) => s + d.apps, 0) / data.length : 0
  const avgY = ptY(avgVal)

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgX = pt.matrixTransform(ctm.inverse()).x
    let closest = 0, minDist = Infinity
    points.forEach(([px], i) => {
      const d = Math.abs(px - svgX)
      if (d < minDist) { minDist = d; closest = i }
    })
    onHoverChange(closest)
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onHoverChange(null)}
    >
      <defs>
        <style>{`@keyframes chartFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
          <stop offset="50%" stopColor="#4338ca" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="60%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c7d2fe" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-20%" y="-120%" width="140%" height="340%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-peakglow`} x="-180%" y="-180%" width="460%" height="460%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-dotglow`} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {gridLines.slice(0, 3).map((val) => {
        const y = MARGIN.top + CHART_H - (val / maxVal) * CHART_H
        return (
          <g key={val}>
            <line
              x1={MARGIN.left} y1={y}
              x2={SVG_W - MARGIN.right} y2={y}
              stroke="#1a1d24"
              strokeWidth={1}
              strokeDasharray="3 8"
            />
            <text
              x={MARGIN.left - 14} y={y + 4}
              textAnchor="end"
              fontSize={isMobile ? 9 : 10}
              fill="#2e3240"
              fontFamily="Sora, sans-serif"
              fontWeight="500"
            >
              {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
            </text>
          </g>
        )
      })}

      <line
        x1={MARGIN.left} y1={chartBottom}
        x2={SVG_W - MARGIN.right} y2={chartBottom}
        stroke="#252830"
        strokeWidth={1}
      />

      {data.map((d, i) => {
        if (d.apps > 0) return null
        return (
          <circle key={d.day} cx={ptX(i)} cy={chartBottom - 1} r={1.5} fill="#252830" />
        )
      })}

      {data.length > 1 && (
        <g>
          <line
            x1={MARGIN.left} y1={avgY}
            x2={SVG_W - MARGIN.right} y2={avgY}
            stroke="#6366f1"
            strokeWidth={1}
            strokeDasharray="4 6"
            strokeOpacity={0.2}
          />
          <text
            x={SVG_W - MARGIN.right + 7} y={avgY + 4}
            fontSize={9}
            fill="#3d4149"
            fontFamily="Sora, sans-serif"
            fontWeight="500"
          >
            avg
          </text>
        </g>
      )}

      {hoveredIndex !== null && (
        <line
          x1={ptX(hoveredIndex)} y1={MARGIN.top}
          x2={ptX(hoveredIndex)} y2={chartBottom}
          stroke="#6366f1"
          strokeWidth={1}
          strokeOpacity={0.18}
        />
      )}

      <path
        key={`area-${animKey}`}
        d={areaPath}
        fill={`url(#${uid}-area)`}
        style={{ animation: 'chartFadeIn 0.6s ease 0.8s both' }}
      />

      <path
        d={linePath}
        fill="none"
        stroke="#818cf8"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.2}
        style={{ filter: 'blur(8px)' }}
      />

      <path
        ref={lineRef}
        d={linePath}
        fill="none"
        stroke={`url(#${uid}-line)`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${uid}-glow)`}
      />

      {data.length > 1 && peakPoint && peakDay.apps > 0 && (() => {
        const [px, py] = peakPoint
        const labelText = `peak · ${peakDay.day} · ${peakDay.apps.toLocaleString()}`
        const labelW = labelText.length * 7.2 + 32
        const labelH = 26
        const GAP = 10
        const fitsLeft = px - GAP - labelW >= MARGIN.left
        const labelX = fitsLeft ? px - GAP - labelW : px + GAP
        const labelY = py - labelH / 2
        const labelCX = labelX + labelW / 2
        return (
          <g key={`peak-${animKey}`} style={{ animation: 'chartFadeIn 0.4s ease 1.2s both' }}>
            <g filter={`url(#${uid}-peakglow)`}>
              <circle cx={px} cy={py} r={16} fill="none" stroke="#818cf8" strokeWidth={1} opacity={0.1} />
              <circle cx={px} cy={py} r={9} fill="rgba(129,140,248,0.12)" />
              <circle cx={px} cy={py} r={5} fill="#ffffff" stroke="#a5b4fc" strokeWidth={2} />
            </g>
            <rect x={labelX} y={labelY} width={labelW} height={labelH} rx={7} fill="rgba(13,14,20,0.97)" stroke="rgba(129,140,248,0.3)" strokeWidth={1} />
            <text
              x={labelCX} y={labelY + labelH / 2 + 4}
              textAnchor="middle"
              fontSize={10.5}
              fontWeight="500"
              fill="#a5b4fc"
              fontFamily="Sora, sans-serif"
              letterSpacing="0.01em"
            >
              {labelText}
            </text>
          </g>
        )
      })()}

      {hoveredIndex !== null && (() => {
        const [x, y] = points[hoveredIndex]
        return (
          <g>
            <circle cx={x} cy={y} r={14} fill="rgba(99,102,241,0.07)" />
            <circle cx={x} cy={y} r={8} fill="rgba(99,102,241,0.13)" />
            <circle cx={x} cy={y} r={4.5} fill="#ffffff" stroke="#a5b4fc" strokeWidth={2} filter={`url(#${uid}-dotglow)`} />
          </g>
        )
      })()}

      {data.map((d, i) => {
        if (i % step !== 0 && i !== n - 1) return null
        const active = hoveredIndex === i
        let textAnchor: 'start' | 'middle' | 'end' = 'middle'
        if (i === 0) textAnchor = 'start'
        else if (i === n - 1) textAnchor = 'end'
        return (
          <text
            key={d.day}
            x={ptX(i)}
            y={chartBottom + 20}
            textAnchor={textAnchor}
            fontSize={isMobile ? 9 : 10}
            fontFamily="Sora, sans-serif"
            fill={active ? '#a5b4fc' : '#2e3240'}
            fontWeight={active ? 600 : 400}
          >
            {d.day}
          </text>
        )
      })}

      {hoveredIndex !== null && (() => {
        const d = data[hoveredIndex]
        const [tx, ty] = points[hoveredIndex]
        const pw = 100, ph = 34
        const px = Math.min(Math.max(tx - pw / 2, MARGIN.left), SVG_W - MARGIN.right - pw)
        const py = ty - ph - 18 < MARGIN.top ? ty + 16 : ty - ph - 18
        return (
          <g>
            <rect x={px} y={py + 2} width={pw} height={ph} rx={9} fill="rgba(0,0,0,0.45)" />
            <rect x={px} y={py} width={pw} height={ph} rx={9} fill="rgba(13,14,20,0.97)" stroke="rgba(129,140,248,0.25)" strokeWidth={1} />
            <text
              x={px + pw / 2} y={py + ph / 2 + 5}
              textAnchor="middle"
              fontSize={12}
              fontWeight="600"
              fill="#e2e8f0"
              fontFamily="Sora, sans-serif"
              letterSpacing="0.01em"
            >
              {d.day}  ·  {d.apps.toLocaleString()}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}
