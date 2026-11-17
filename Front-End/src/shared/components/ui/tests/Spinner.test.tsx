import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from '../Spinner'

const LOADING_LABEL = 'Loading'

describe('Spinner', () => {
  it('renders with default size (md)', () => {
    render(<Spinner />)
    const el = screen.getByLabelText(LOADING_LABEL)
    expect(el.className).toContain('w-[14px]')
  })

  it('renders sm size class', () => {
    render(<Spinner size="sm" />)
    expect(screen.getByLabelText(LOADING_LABEL).className).toContain('w-3')
  })

  it('renders lg size class', () => {
    render(<Spinner size="lg" />)
    expect(screen.getByLabelText(LOADING_LABEL).className).toContain('w-[18px]')
  })

  it('always carries the btn-spinner base class', () => {
    render(<Spinner />)
    expect(screen.getByLabelText(LOADING_LABEL).className).toContain('btn-spinner')
  })
})
