import { CheckCircle2, Loader2, X } from 'lucide-react'
import { useUploadProgress } from '../../context/UploadProgressContext'

export function UploadProgressBanner() {
  const { isActive, batchesDone, batchesTotal, isComplete, dismiss } = useUploadProgress()

  if (!isActive) return null

  const pct = batchesTotal > 0 ? Math.round((batchesDone / batchesTotal) * 100) : 0
  const pluralSuffix = batchesTotal === 1 ? '' : 'es'
  const progressText = batchesTotal > 0 ? `Batch ${batchesDone} of ${batchesTotal} complete` : 'Starting upload…'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9990,
        width: 284,
        background: '#1a1b1e',
        border: `1px solid ${isComplete ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12,
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isComplete
            ? <CheckCircle2 size={15} color="#22c55e" />
            : <Loader2 size={15} color="#6ea8fe" className="animate-spin" />}
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f9fafb' }}>
            {isComplete ? 'Upload complete' : 'Processing resumes'}
          </span>
        </div>
        {isComplete && (
          <button
            onClick={dismiss}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#6b7280', display: 'flex' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Subtitle */}
      <p style={{ fontSize: 12, color: '#6b7280', margin: 0, marginBottom: isComplete ? 0 : 10 }}>
        {isComplete ? `All ${batchesTotal} batch${pluralSuffix} processed` : progressText}
      </p>

      {/* Progress bar — only while in progress */}
      {!isComplete && (
        <div style={{ height: 3, background: '#2a2b2f', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #1d2ba4, #6ea8fe)',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      )}
    </div>
  )
}
