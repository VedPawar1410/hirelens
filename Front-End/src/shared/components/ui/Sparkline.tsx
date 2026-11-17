import { useId } from 'react'

export interface SparklineProps {
  readonly data: number[]
  readonly width?: number | string
  readonly height?: number
  readonly color?: string
}

export function Sparkline({ data, width = 88, height = 30, color = '#818cf8' }: SparklineProps) {
  const reactId = useId()
  const pts = data.length >= 2 ? data : new Array<number>(8).fill(0)
  const min = pts.reduce((a, v) => Math.min(v, a), pts[0])
  const max = pts.reduce((a, v) => Math.max(v, a), pts[0])
  const pad = 2
  const allFlat = max === min
  const norm = pts.map(v => (allFlat ? 0.15 : (v - min) / (max - min)))
  // use numeric width for path math; if string (e.g. "100%"), calculate in 200-unit space
  const viewW = typeof width === 'number' ? width : 200
  const step = (viewW - pad * 2) / (norm.length - 1)
  const coords = norm.map((v, i) => ({
    x: pad + i * step,
    y: pad + (1 - v) * (height - pad * 2),
  }))
  const linePath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath =
    `M${coords[0].x.toFixed(1)},${height} ` +
    coords.map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    ` L${coords.at(-1)!.x.toFixed(1)},${height} Z`

  const gradId = `sg-${reactId.replaceAll(':', '')}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewW} ${height}`}
      fill="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={allFlat ? 'none' : `url(#${gradId})`} />
      <path
        d={linePath}
        stroke={allFlat ? '#2a2d35' : color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={allFlat ? '3 3' : undefined}
      />
      {!allFlat && (
        <circle
          cx={coords.at(-1)!.x}
          cy={coords.at(-1)!.y}
          r="2.5"
          fill={color}
        />
      )}
    </svg>
  )
}
