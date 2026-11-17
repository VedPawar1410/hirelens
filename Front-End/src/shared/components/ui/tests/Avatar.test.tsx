import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Avatar } from '../Avatar'

describe('Avatar', () => {
  it('renders initials from first two words of name', () => {
    render(<Avatar name="John Doe" avatarUrl={null} />)
    expect(screen.getByLabelText('John Doe')).toHaveTextContent('JD')
  })

  it('upper-cases initials', () => {
    render(<Avatar name="alice baker" avatarUrl={null} />)
    expect(screen.getByLabelText('alice baker')).toHaveTextContent('AB')
  })

  it('renders single initial for single-word name', () => {
    render(<Avatar name="Cher" avatarUrl={null} />)
    expect(screen.getByLabelText('Cher')).toHaveTextContent('C')
  })

  it('renders empty initials for empty name', () => {
    render(<Avatar name="" avatarUrl={null} />)
    expect(screen.getByLabelText('')).toHaveTextContent('')
  })

  it('handles null name', () => {
    render(<Avatar name={null} avatarUrl={null} />)
    expect(screen.getByLabelText('')).toBeInTheDocument()
  })

  it('renders <img> when avatarUrl is provided', () => {
    render(<Avatar name="Jane" avatarUrl="https://x.com/p.png" />)
    const img = document.querySelector('img')
    expect(img?.src).toBe('https://x.com/p.png')
  })

  it('omits <img> when avatarUrl is null', () => {
    render(<Avatar name="Jane" avatarUrl={null} />)
    expect(document.querySelector('img')).toBeNull()
  })

  it('img starts at opacity 0 and becomes 1 after onLoad', () => {
    render(<Avatar name="Jane" avatarUrl="p.png" />)
    const img = document.querySelector('img')
    expect(img?.style.opacity).toBe('0')
    if (img) fireEvent.load(img)
    expect(img?.style.opacity).toBe('1')
  })

  it('honors custom size', () => {
    render(<Avatar name="X" avatarUrl={null} size={64} />)
    const wrapper = screen.getByLabelText('X').parentElement
    expect(wrapper?.style.width).toBe('64px')
    expect(wrapper?.style.height).toBe('64px')
  })
})
