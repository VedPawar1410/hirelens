export const MARGIN = { top: 48, right: 44, bottom: 52, left: 58 }

export function niceMax(rawMax: number): number {
  if (rawMax <= 0) return 10
  const padded = rawMax * 1.4
  const step = Math.pow(10, Math.floor(Math.log10(padded)))
  return Math.ceil(padded / step) * step
}

export function smoothPath(pts: [number, number][], maxY?: number): string {
  if (!pts.length) return ''
  if (pts.length === 1) return `M ${pts[0][0]},${pts[0][1]}`
  if (pts.length === 2)
    return `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} L ${pts[1][0].toFixed(1)},${pts[1][1].toFixed(1)}`
  const t = 0.3
  const clamp = (v: number) => (maxY === undefined ? v : Math.min(v, maxY))
  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1[0] + (p2[0] - p0[0]) * t
    const cp1y = clamp(p1[1] + (p2[1] - p0[1]) * t)
    const cp2x = p2[0] - (p3[0] - p1[0]) * t
    const cp2y = clamp(p2[1] - (p3[1] - p1[1]) * t)
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

export function labelStep(n: number): number {
  if (n <= 8) return 1
  if (n <= 16) return 2
  if (n <= 40) return 7
  return 14
}
