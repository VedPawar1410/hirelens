import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AvatarStack } from '../AvatarStack'

describe('AvatarStack', () => {
  it('renders em dash when no candidates', () => {
    render(<AvatarStack candidates={[]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('caps display at first 4 candidates', () => {
    const cands = Array.from({ length: 8 }, (_, i) => ({ name: `Person ${i}`, avatarUrl: null }))
    render(<AvatarStack candidates={cands} />)
    for (let i = 0; i < 4; i++) {
      expect(screen.getByLabelText(`Person ${i}`)).toBeInTheDocument()
    }
    expect(screen.queryByLabelText('Person 4')).toBeNull()
  })

  it('renders fewer when count under 4', () => {
    render(<AvatarStack candidates={[{ name: 'Alice', avatarUrl: null }, { name: 'Bob', avatarUrl: null }]} />)
    expect(screen.getByLabelText('Alice')).toBeInTheDocument()
    expect(screen.getByLabelText('Bob')).toBeInTheDocument()
  })
})
