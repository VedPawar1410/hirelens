import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Sparkline } from '../Sparkline'

describe('Sparkline', () => {
  it('renders an SVG with provided width and height', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} width={120} height={40} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('120')
    expect(svg?.getAttribute('height')).toBe('40')
  })

  it('falls back to zero-filled series when fewer than 2 data points', () => {
    const { container } = render(<Sparkline data={[5]} />)
    expect(container.querySelector('svg path')).toBeInTheDocument()
  })

  it('uses dashed flat line when all values equal (no variation)', () => {
    const { container } = render(<Sparkline data={[3, 3, 3, 3]} />)
    const stroke = container.querySelector('svg path[stroke-dasharray]')
    expect(stroke).not.toBeNull()
  })

  it('renders the line + area paths and an end-circle when not flat', () => {
    const { container } = render(<Sparkline data={[1, 5, 3, 8]} />)
    const paths = container.querySelectorAll('svg path')
    expect(paths.length).toBeGreaterThanOrEqual(2)
    expect(container.querySelector('svg circle')).not.toBeNull()
  })

  it('honors color override', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} color="#ff0000" />)
    const linePath = Array.from(container.querySelectorAll('svg path')).find(p => p.getAttribute('stroke') === '#ff0000')
    expect(linePath).toBeDefined()
  })
})
