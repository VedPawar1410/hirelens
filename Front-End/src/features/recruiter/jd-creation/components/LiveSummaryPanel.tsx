import { LayoutGrid } from 'lucide-react'
import type { JDFormState } from './types'

const LEVEL_LABELS: Record<string, string> = {
  intern: 'Intern',
  fresher: 'Fresher',
  experienced: 'Experienced',
}

interface Props {
  readonly form: JDFormState
  readonly isComplete: boolean
  readonly fieldsFilled: number
  readonly fieldsTotal: number
}

function Row({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-0.75">
      <span className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280]">{label}</span>
      <span className="text-[14px] font-medium text-white">{value || '—'}</span>
    </div>
  )
}

export function LiveSummaryPanel({ form, isComplete, fieldsFilled, fieldsTotal }: Props) {
  const level = form.experienceLevel
  const progress = fieldsTotal > 0 ? Math.round((fieldsFilled / fieldsTotal) * 100) : 0

  const levelLabel = LEVEL_LABELS[level ?? ''] ?? '—'

  const salaryLabel =
    level === 'intern' ? 'Full-Time Conversion Salary' : 'Full-Time Salary'
  const progressLabel = fieldsTotal > 0 ? `${progress}%` : '—'
  const completionLabel = isComplete ? 'Ready' : progressLabel

  return (
    <div className="w-75 shrink-0 sticky top-6">
      <div
        className="rounded-[18px] p-0.75"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="bg-[#161719] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid #37373f' }}>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(29,43,164,0.2)', border: '1px solid rgba(29,43,164,0.35)' }}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#6ea8fe]" />
            </div>
            <span className="text-[14px] font-bold text-white">Live Summary</span>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-5 px-5 py-5">
            <Row label="Job Title" value={form.jobTitle} />
            <Row label="Experience Level" value={levelLabel} />
            <Row label="Location" value={form.location} />
            <Row label="Work Mode" value={form.workMode} />
            <Row label="Work Hours" value={form.workHours} />

            {level === 'intern' && (
              <>
                <Row label="Duration" value={form.duration} />
                <Row label="Stipend / Month" value={form.stipendSalary ? `₹${form.stipendSalary}` : ''} />
              </>
            )}

            {level === 'experienced' && (
              <>
                <Row label="Years of Experience" value={form.yearsOfExperience} />
                <Row label="Notice Period" value={form.noticePeriod} />
              </>
            )}

            {(level === 'intern' || level === 'fresher') && (
              <Row label={salaryLabel} value={form.fulltimeOfferSalary ? `₹${form.fulltimeOfferSalary}` : ''} />
            )}

            {level === 'experienced' && form.fulltimeOfferSalary && (
              <Row label="Salary" value={`₹${form.fulltimeOfferSalary}`} />
            )}

            <Row label="Role Description" value={form.roleDescription} />
            <Row
              label="Assigned To"
              value={form.assignedTo.length > 0 ? form.assignedTo.join(', ') : ''}
            />
          </div>

          {/* Footer */}
          <div className="px-5 py-4" style={{ borderTop: '1px solid #37373f' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-[#9ca3af]">Completion</span>
              <span
                className="text-[13px] font-bold"
                style={{ color: isComplete ? '#4ade80' : '#6b7280' }}
              >
                {completionLabel}
              </span>
            </div>
            <div className="h-0.75 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: isComplete ? '#4ade80' : '#6ea8fe',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
