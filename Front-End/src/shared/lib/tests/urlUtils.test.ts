import { describe, it, expect } from 'vitest'
import { toSafeHttpUrl } from '../urlUtils'

describe('toSafeHttpUrl', () => {
  it('returns null for null, undefined, and blank input', () => {
    expect(toSafeHttpUrl(null)).toBeNull()
    expect(toSafeHttpUrl(undefined)).toBeNull()
    expect(toSafeHttpUrl('')).toBeNull()
    expect(toSafeHttpUrl('   ')).toBeNull()
  })

  it('rejects javascript: URLs', () => {
    expect(toSafeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(toSafeHttpUrl('javascript://comment%0aalert(1)')).toBeNull()
  })

  it('rejects mixed-case and whitespace-obfuscated javascript: URLs', () => {
    expect(toSafeHttpUrl('JaVaScRiPt://alert(1)')).toBeNull()
    expect(toSafeHttpUrl('java\tscript://alert(1)')).toBeNull()
  })

  it('rejects data: and vbscript: URLs', () => {
    expect(toSafeHttpUrl('data://text/html,<script>alert(1)</script>')).toBeNull()
    expect(toSafeHttpUrl('vbscript://msgbox(1)')).toBeNull()
  })

  it('passes through https URLs unchanged', () => {
    expect(toSafeHttpUrl('https://linkedin.com/in/jane')).toBe('https://linkedin.com/in/jane')
  })

  it('passes through http URLs', () => {
    expect(toSafeHttpUrl('http://example.com/path')).toBe('http://example.com/path')
  })

  it('prefixes bare domains with https://', () => {
    expect(toSafeHttpUrl('github.com/jane')).toBe('https://github.com/jane')
    expect(toSafeHttpUrl('www.linkedin.com/in/jane')).toBe('https://www.linkedin.com/in/jane')
  })

  it('trims surrounding whitespace before validating', () => {
    expect(toSafeHttpUrl('  https://github.com/jane  ')).toBe('https://github.com/jane')
  })

  it('returns null for unparseable input', () => {
    expect(toSafeHttpUrl('not a url at all')).toBeNull()
  })
})
