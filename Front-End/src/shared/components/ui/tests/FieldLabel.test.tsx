import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FieldLabel } from '../FieldLabel'

describe('FieldLabel', () => {
  it('renders label text', () => {
    render(<FieldLabel>Email</FieldLabel>)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('shows required asterisk when required', () => {
    render(<FieldLabel required>Email</FieldLabel>)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('omits asterisk when not required', () => {
    render(<FieldLabel>Email</FieldLabel>)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })
})
