import { describe, it, expect, vi } from 'vitest'
import { createRef } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { ChartSvg } from '../ChartSvg'

describe('ChartSvg', () => {
  const data = [
    { day: 'Mon', apps: 4 },
    { day: 'Tue', apps: 9 },
    { day: 'Wed', apps: 6 },
  ]

  it('renders the svg with the configured viewBox', () => {
    const { container } = render(
      <ChartSvg
        uid="u1" data={data} svgSize={{ w: 320, h: 180 }} isMobile={false}
        hoveredIndex={null} animKey="a" lineRef={createRef<SVGPathElement>()}
        onHoverChange={vi.fn()}
      />,
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 320 180')
  })

  it('renders day labels for first and last entries', () => {
    const { container } = render(
      <ChartSvg
        uid="u1" data={data} svgSize={{ w: 320, h: 180 }} isMobile={false}
        hoveredIndex={null} animKey="a" lineRef={createRef<SVGPathElement>()}
        onHoverChange={vi.fn()}
      />,
    )
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent)
    expect(texts).toContain('Mon')
    expect(texts).toContain('Wed')
  })

  it('shows the peak label for the highest day', () => {
    const { container } = render(
      <ChartSvg
        uid="u1" data={data} svgSize={{ w: 320, h: 180 }} isMobile={false}
        hoveredIndex={null} animKey="a" lineRef={createRef<SVGPathElement>()}
        onHoverChange={vi.fn()}
      />,
    )
    expect(container.textContent).toContain('peak · Tue · 9')
  })

  it('does not render peak label when single data point', () => {
    const { container } = render(
      <ChartSvg
        uid="u1" data={[{ day: 'Mon', apps: 3 }]} svgSize={{ w: 320, h: 180 }} isMobile={false}
        hoveredIndex={null} animKey="a" lineRef={createRef<SVGPathElement>()}
        onHoverChange={vi.fn()}
      />,
    )
    expect(container.textContent).not.toContain('peak ·')
  })

  it('emits null hover on mouse leave', () => {
    const onHoverChange = vi.fn()
    const { container } = render(
      <ChartSvg
        uid="u1" data={data} svgSize={{ w: 320, h: 180 }} isMobile={false}
        hoveredIndex={null} animKey="a" lineRef={createRef<SVGPathElement>()}
        onHoverChange={onHoverChange}
      />,
    )
    const svgEl = container.querySelector('svg')
    if (svgEl) fireEvent.mouseLeave(svgEl)
    expect(onHoverChange).toHaveBeenCalledWith(null)
  })
})
