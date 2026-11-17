import type { CandidateStatus } from '../../../../../shared/types/index'
import { COLUMNS, STATUS_CHIP } from '../../utils/jobFolderUtils'

export interface StageRailProps {
  readonly selectedStage: CandidateStatus
  readonly onSelectStage: (stage: CandidateStatus) => void
  readonly stageCounts: Record<string, number>
  readonly isLoading: boolean
}

export function StageRail({ selectedStage, onSelectStage, stageCounts, isLoading }: StageRailProps) {
  const pipelineStages = COLUMNS.filter(c => c.status !== 'rejected')
  const rejectedChip = STATUS_CHIP['rejected']
  const totalInPipeline = Object.entries(stageCounts)
    .filter(([status]) => status !== 'rejected')
    .reduce((sum, [, count]) => sum + count, 0)

  return (
    <div style={{
      flex: 0.63,
      borderRight: '1px solid #37373f',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: '#111214',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16, paddingBottom: 8 }}>
        <p style={{
          margin: '0 0 6px', padding: '0 16px',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)',
        }}>
          Stages
        </p>

        {pipelineStages.map(col => {
          const isSelected = col.status === selectedStage
          const chip = STATUS_CHIP[col.status]
          const count = isLoading ? null : (stageCounts[col.status] ?? 0)

          return (
            <button
              key={col.status}
              onClick={() => onSelectStage(col.status)}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 16px 8px 13px',
                borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                borderLeft: `3px solid ${isSelected ? chip.color : 'transparent'}`,
                background: isSelected ? chip.bg : 'transparent',
                cursor: 'pointer', transition: 'background 100ms',
              }}
            >
              <span style={{
                fontSize: 13, fontWeight: isSelected ? 600 : 400,
                color: isSelected ? chip.color : '#9ca3af',
              }}>
                {col.label}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: isSelected ? chip.color : 'rgba(255,255,255,0.22)',
              }}>
                {count ?? '–'}
              </span>
            </button>
          )
        })}

        <div style={{ height: 1, background: 'rgba(239,68,68,0.12)', margin: '8px 16px' }} />

        <button
          onClick={() => onSelectStage('rejected')}
          onMouseEnter={e => { if (selectedStage !== 'rejected') e.currentTarget.style.background = 'rgba(239,68,68,0.05)' }}
          onMouseLeave={e => { if (selectedStage !== 'rejected') e.currentTarget.style.background = 'transparent' }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px 8px 13px',
            borderTop: 'none', borderRight: 'none', borderBottom: 'none',
            borderLeft: `3px solid ${selectedStage === 'rejected' ? rejectedChip.color : 'transparent'}`,
            background: selectedStage === 'rejected' ? rejectedChip.bg : 'transparent',
            cursor: 'pointer', transition: 'background 100ms',
          }}
        >
          <span style={{
            fontSize: 13, fontWeight: selectedStage === 'rejected' ? 600 : 400,
            color: selectedStage === 'rejected' ? rejectedChip.color : '#f87171',
          }}>
            Rejected
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>
            {isLoading ? '–' : (stageCounts['rejected'] ?? 0)}
          </span>
        </button>
      </div>

      <div style={{ padding: '14px 16px', borderTop: '1px solid #37373f', flexShrink: 0 }}>
        <p style={{
          margin: '0 0 10px', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.22)',
        }}>
          Folder Health
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>Total in pipeline</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
            {isLoading ? '–' : totalInPipeline}
          </span>
        </div>
      </div>
    </div>
  )
}
