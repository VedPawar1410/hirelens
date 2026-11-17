import { STAGE_ORDER, STATUS_BADGE } from '../../../../recruiter/candidates/utils/candidateStatus'
import { BezelCard } from '../../../../../shared/components/ui/BezelCard'
import { PipelineBar } from '../../../../../shared/components/ui/PipelineBar'

export function PipelineCard({ activeStageIdx }: { readonly activeStageIdx: number }) {
  const stage = STAGE_ORDER[activeStageIdx]
  const badge = stage ? STATUS_BADGE[stage] : null

  return (
    <BezelCard>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase m-0" style={{ color: '#6ea8fe' }}>
          Pipeline Position
        </p>
        {badge && (
          <span className="text-[11px] font-medium px-2 py-0.75 rounded-md"
            style={{ background: 'rgba(29,43,164,0.15)', color: '#6ea8fe', border: '1px solid rgba(110,168,254,0.2)' }}>
            {badge.label}
          </span>
        )}
      </div>
      <PipelineBar activeStageIdx={activeStageIdx} />
    </BezelCard>
  )
}
