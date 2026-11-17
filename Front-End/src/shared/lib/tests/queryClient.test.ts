import { describe, it, expect } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { queryClient } from '../queryClient'

describe('queryClient', () => {
  it('is a QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('configures retry=1 on queries', () => {
    const opts = queryClient.getDefaultOptions()
    expect(opts.queries?.retry).toBe(1)
  })

  it('configures staleTime of 5 minutes', () => {
    const opts = queryClient.getDefaultOptions()
    expect(opts.queries?.staleTime).toBe(5 * 60 * 1000)
  })

  it('configures gcTime of 10 minutes', () => {
    const opts = queryClient.getDefaultOptions()
    expect(opts.queries?.gcTime).toBe(10 * 60 * 1000)
  })

  it('is a singleton — same instance on every import', async () => {
    const reimport = await import('../queryClient')
    expect(reimport.queryClient).toBe(queryClient)
  })

  it('exposes clear() so consumers can wipe cache on logout', () => {
    expect(typeof queryClient.clear).toBe('function')
  })
})
