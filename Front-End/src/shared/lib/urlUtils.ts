// Candidate links come from AI-parsed resumes and interview links from API payloads —
// both untrusted, so anything that isn't http(s) (javascript:, data:, vbscript:)
// must be dropped rather than rendered as a clickable href.
export function toSafeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const candidate = raw.trim()
  if (!candidate) return null
  try {
    // Resumes often hold bare domains like "linkedin.com/in/jane" — give those a
    // scheme so they parse as absolute URLs instead of relative paths
    const url = new URL(candidate.includes('://') ? candidate : `https://${candidate}`)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}
