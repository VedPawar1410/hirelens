import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TypeIcon } from '../TypeIcon'

describe('TypeIcon', () => {
  it('renders a Phone icon for type "Phone Screen"', () => {
    const { container } = render(<TypeIcon type="Phone Screen" />)
    // lucide-react renders as SVG. Verify by checking icon-specific path
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('lucide-phone')
  })

  it('renders a MapPin icon for "Onsite Visit"', () => {
    const { container } = render(<TypeIcon type="Onsite Visit" />)
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('lucide-map-pin')
  })

  it('renders a MapPin icon for "In Person"', () => {
    const { container } = render(<TypeIcon type="In Person" />)
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('lucide-map-pin')
  })

  it('falls back to Video icon for unknown types', () => {
    const { container } = render(<TypeIcon type="Video Call" />)
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('lucide-video')
  })

  it('honors size prop', () => {
    const { container } = render(<TypeIcon type="phone" size={24} />)
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('24')
  })
})
