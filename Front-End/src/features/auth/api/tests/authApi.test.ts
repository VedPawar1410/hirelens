import { describe, it, expect } from 'vitest'
import { login } from '../authApi'
import { login as sharedLogin } from '../../../../shared/api/authApi'

describe('features/auth/api/authApi', () => {
  it('re-exports the same login fn from shared/api/authApi', () => {
    expect(login).toBe(sharedLogin)
  })
})
