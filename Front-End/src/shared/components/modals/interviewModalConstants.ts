// Current local time as a `datetime-local` value (YYYY-MM-DDTHH:mm) for the `min`
// attribute, so the native picker greys out past dates/times.
export function nowDatetimeLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const INTERVIEW_MODES = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
] as const

export type InterviewMode = typeof INTERVIEW_MODES[number]['value']

export const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#1a1b1e',
  border: '1px solid #37373f',
  borderRadius: 6,
  color: '#e5e7eb',
  fontSize: 13,
  padding: '8px 10px',
  outline: 'none',
  boxSizing: 'border-box',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#9ca3af',
  marginBottom: 5,
  fontWeight: 500,
}
