import { describe, it, expect } from 'vitest'

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })

  it('has DOM', () => {
    const div = document.createElement('div')
    div.textContent = 'hi'
    expect(div).toHaveTextContent('hi')
  })
})
