import { CalendarRange, Sparkles, UserCheck } from 'lucide-react'
import { JDFormFields } from './JDFormFields'
import { AssignInterviewerPanel } from './AssignInterviewerPanel'
import { InterviewRoundsEditor } from '../../../../shared/components/ui/InterviewRoundsEditor'
import type { JDFormState } from './types'

interface FormActionsPanelProps {
  readonly form: JDFormState
  readonly setField: <K extends keyof JDFormState>(key: K, value: JDFormState[K]) => void
  readonly fieldErrors: Record<string, string>
  readonly isMobile: boolean
  readonly canAssign: boolean
  readonly canCreate: boolean
  readonly isAssigning: boolean
  readonly isGeneratingFromForm: boolean
  readonly isBusy: boolean
  readonly onAssign: () => void
  readonly onCreate: () => void
}

export function FormActionsPanel({
  form, setField, fieldErrors, isMobile,
  canAssign, canCreate, isAssigning, isGeneratingFromForm, isBusy,
  onAssign, onCreate,
}: FormActionsPanelProps) {
  return (
    <div className="bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[18px] p-0.75">
      <div className={`bg-[#161719] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ${isMobile ? 'p-5' : 'p-7'}`}>
        <JDFormFields form={form} setField={setField} fieldErrors={fieldErrors} isMobile={isMobile} />

        <AssignInterviewerPanel
          assignedTo={form.assignedTo}
          onChange={(assigned) => setField('assignedTo', assigned)}
        />

        <div className="mb-5">
          <div className="flex items-center gap-1.75 mb-2.5">
            <CalendarRange size={14} className="text-[#6ea8fe]" />
            <span className="text-[13px] font-semibold text-white">Interview Process</span>
            <span className="text-[11px] text-[#6b7280]">Define the rounds for this role</span>
          </div>
          <InterviewRoundsEditor
            value={form.interviewRounds}
            onChange={(rounds) => setField('interviewRounds', rounds)}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onAssign}
            disabled={!canAssign}
            title={form.assignedTo.length === 0 ? 'Select at least one interviewer to assign' : ''}
            className={`flex items-center gap-1.75 py-2.5 px-5 rounded-[9px] text-sm font-semibold border transition-[background,opacity] duration-150 ${
              canAssign
                ? 'text-white bg-[rgba(29,43,164,0.15)] border-[rgba(29,43,164,0.5)] cursor-pointer hover:bg-[rgba(29,43,164,0.25)]'
                : 'text-[#6b7280] bg-transparent border-[#37373f] cursor-not-allowed opacity-50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            {isAssigning ? 'Assigning...' : 'Assign'}
          </button>

          <button
            onClick={onCreate}
            disabled={!canCreate}
            title={!canCreate && !isBusy ? 'Fill in all required fields including the role description to generate a JD' : ''}
            className={`flex items-center gap-2 py-2.5 px-5.5 rounded-[9px] text-sm font-semibold text-white bg-[#1d2ba4] border-none transition-[background,box-shadow,opacity] duration-150 ${
              canCreate
                ? 'cursor-pointer shadow-[0_4px_16px_rgba(29,43,164,0.35)] hover:bg-[#12219e]'
                : 'cursor-not-allowed opacity-50 shadow-none'
            }`}
          >
            {isGeneratingFromForm ? (
              <span className="w-3.5 h-3.5 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full inline-block animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isGeneratingFromForm ? 'Generating JD...' : 'Create JD'}
          </button>
        </div>
      </div>
    </div>
  )
}
