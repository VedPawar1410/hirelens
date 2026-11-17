interface FeedbackFormFieldsProps {
  readonly rating: number
  readonly onRatingChange: (n: number) => void
  readonly recommendation: string
  readonly onRecommendationChange: (v: string) => void
  readonly notes: string
  readonly onNotesChange: (v: string) => void
  readonly isPending: boolean
  readonly isError: boolean
  readonly errorMessage?: string
  readonly onSubmit: () => void
}

export function FeedbackFormFields({
  rating,
  onRatingChange,
  recommendation,
  onRecommendationChange,
  notes,
  onNotesChange,
  isPending,
  isError,
  errorMessage = 'Failed to submit feedback. Please try again.',
  onSubmit,
}: FeedbackFormFieldsProps) {
  const canSubmit = rating > 0 && !!recommendation && !!notes.trim()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4b5563' }}>Score <span style={{ color: '#ef4444' }}>*</span></span>
          {rating > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', letterSpacing: '-0.01em' }}>
              {rating}<span style={{ fontSize: 11, fontWeight: 400, color: '#4b5563' }}>/5</span>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => onRatingChange(n)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                background: rating >= n ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${rating >= n ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.06)'}`,
                color: rating >= n ? '#a5b4fc' : 'rgba(255,255,255,0.2)',
                transition: 'all 120ms',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4b5563' }}>Recommendation <span style={{ color: '#ef4444' }}>*</span></span>
        <select
          value={recommendation}
          onChange={e => onRecommendationChange(e.target.value)}
          className="w-full appearance-none outline-none cursor-pointer"
          style={{
            background: '#1a1b1e', border: '1px solid #2a2a32', borderRadius: 10,
            padding: '11px 14px', fontSize: 13, fontFamily: 'inherit',
            color: recommendation ? '#d1d5db' : '#4b5563', transition: 'border-color 120ms',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#2a2a32' }}
        >
          <option value="">Select recommendation…</option>
          <option value="StrongHire" style={{ color: '#d1d5db' }}>Strong Hire</option>
          <option value="Hire" style={{ color: '#d1d5db' }}>Hire</option>
          <option value="Hold" style={{ color: '#d1d5db' }}>Hold</option>
          <option value="NoHire" style={{ color: '#d1d5db' }}>No Hire</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4b5563' }}>Notes <span style={{ color: '#ef4444' }}>*</span></span>
        <textarea
          rows={4}
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="Add interview notes…"
          className="w-full resize-none outline-none placeholder:text-[#4b5563]"
          style={{
            background: '#1a1b1e', border: '1px solid #2a2a32', borderRadius: 10,
            padding: '11px 14px', fontSize: 13, fontFamily: 'inherit',
            color: '#d1d5db', lineHeight: 1.6, transition: 'border-color 120ms', boxSizing: 'border-box',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#2a2a32' }}
        />
      </div>

      {isError && (
        <p style={{ fontSize: 12, padding: '9px 12px', borderRadius: 8, margin: 0, color: '#f87171', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
          {errorMessage}
        </p>
      )}

      <button
        onClick={() => { if (canSubmit && !isPending) onSubmit() }}
        disabled={!canSubmit || isPending}
        className="w-full cursor-pointer disabled:opacity-40"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a32', borderRadius: 10, padding: '12px 14px', fontSize: 13, fontWeight: 500, color: '#9ca3af', transition: 'background 150ms' }}
        onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      >
        {isPending ? 'Submitting…' : 'Submit Feedback'}
      </button>
    </div>
  )
}
