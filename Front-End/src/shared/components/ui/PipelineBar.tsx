// Local copy — shared/ cannot import from features/. Keep in sync with candidateStatus.ts.
const STAGE_ORDER = [
  'under_review', 'filtered', 'shortlisted', 'interviewing', 'selected',
] as const

const STAGE_ABBREV: Record<string, string> = {
  under_review: 'Rev', filtered: 'Flt', shortlisted: 'Srt',
  interviewing: 'Intv', selected: 'Sel',
}

function getDotBackground(isActive: boolean, isPast: boolean): string {
  if (isActive) return '#6ea8fe'
  if (isPast) return 'rgba(110,168,254,0.55)'
  return 'transparent'
}

function getLabelColor(idx: number, activeStageIdx: number): string {
  if (idx === activeStageIdx) return 'rgba(255,255,255,0.8)'
  if (idx < activeStageIdx) return 'rgba(110,168,254,0.5)'
  return 'rgba(255,255,255,0.2)'
}

export function PipelineBar({ activeStageIdx }: Readonly<{ activeStageIdx: number }>) {
  return (
    <div>
      <div className="flex items-center">
        {STAGE_ORDER.flatMap((stage, idx) => {
          const isPast = activeStageIdx >= 0 ? idx < activeStageIdx : true
          const isActive = idx === activeStageIdx
          const nodes = []
          if (idx > 0) nodes.push(
            <div key={`l${stage}`} style={{ flex: 1, height: 1, background: isPast ? 'rgba(110,168,254,0.4)' : 'rgba(255,255,255,0.1)' }} />
          )
          nodes.push(
            <div key={stage} style={{
              width: isActive ? 10 : 7, height: isActive ? 10 : 7,
              borderRadius: '50%', flexShrink: 0,
              background: getDotBackground(isActive, isPast),
              border: !isActive && !isPast ? '1.5px solid rgba(255,255,255,0.2)' : 'none',
              boxShadow: isActive ? '0 0 8px rgba(110,168,254,0.55)' : 'none',
              transition: 'all 200ms ease',
            }} />
          )
          return nodes
        })}
      </div>
      <div className="flex justify-between mt-1.75">
        {STAGE_ORDER.map((stage, idx) => (
          <span key={stage} style={{
            fontSize: 9, fontFamily: 'Sora, sans-serif', letterSpacing: '0.02em',
            color: getLabelColor(idx, activeStageIdx),
          }}>
            {STAGE_ABBREV[stage]}
          </span>
        ))}
      </div>
    </div>
  )
}
