import { describe, it, expect } from 'vitest'
import { jobsQueryKeys } from '../jobsQueryKeys'

describe('jobsQueryKeys', () => {
  it('all() returns ["jobs"]', () => {
    expect(jobsQueryKeys.all()).toEqual(['jobs'])
  })

  it('list(page) returns ["jobs", page]', () => {
    expect(jobsQueryKeys.list(1)).toEqual(['jobs', 1])
    expect(jobsQueryKeys.list(42)).toEqual(['jobs', 42])
  })

  it('detail(jobId) returns ["jobs", jobId]', () => {
    expect(jobsQueryKeys.detail('abc-123')).toEqual(['jobs', 'abc-123'])
  })

  it('different pages produce non-equal keys', () => {
    expect(jobsQueryKeys.list(1)).not.toEqual(jobsQueryKeys.list(2))
  })
})
