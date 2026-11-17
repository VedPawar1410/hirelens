import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JobFolderStatusChip } from '../JobFolderStatusChip'

describe('JobFolderStatusChip', () => {
  it('capitalizes "active" and shows in green', () => {
    render(<JobFolderStatusChip status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Active').className).toContain('#22c55e')
  })

  it('capitalizes "paused" with amber', () => {
    render(<JobFolderStatusChip status="paused" />)
    expect(screen.getByText('Paused').className).toContain('#d97706')
  })

  it('capitalizes "closed" with grey', () => {
    render(<JobFolderStatusChip status="closed" />)
    expect(screen.getByText('Closed').className).toContain('#9ca3af')
  })
})
