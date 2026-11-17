import { Briefcase, MapPin, Clock, DollarSign, FileText, Timer, Award } from 'lucide-react'
import { FormInput } from '../../../../shared/components/ui/FormInput'
import { FormSelect } from '../../../../shared/components/ui/FormSelect'
import { FieldLabel } from '../../../../shared/components/ui/FieldLabel'
import { SectionLabel } from '../../../../shared/components/ui/SectionLabel'
import { LOCATIONS, WORK_MODES, WORK_HOURS, NOTICE_PERIODS } from '../constants/jd'
import type { JDFormState } from './types'

interface Props {
  readonly form: JDFormState
  readonly setField: <K extends keyof JDFormState>(key: K, value: JDFormState[K]) => void
  readonly fieldErrors: Record<string, string>
  readonly isMobile?: boolean
}

export function JDFormFields({ form, setField, fieldErrors, isMobile = false }: Props) {
  return (
    <>
      <SectionLabel icon={Briefcase} text="Role Details" />

      <div className="mb-5">
        <FieldLabel required>Job Title</FieldLabel>
        <FormInput
          type="text"
          value={form.jobTitle}
          onChange={(e) => setField('jobTitle', e.target.value)}
          placeholder="e.g. Frontend Developer, Data Analyst"
          error={fieldErrors.jobTitle}
        />
      </div>

      {form.experienceLevel === 'intern' && (
        <div className="mb-5">
          <FieldLabel required>Duration</FieldLabel>
          <FormInput
            type="text"
            value={form.duration}
            onChange={(e) => setField('duration', e.target.value)}
            placeholder="e.g. 3 months, 6 months"
            error={fieldErrors.duration}
          />
        </div>
      )}

      <div className={`grid gap-4 mb-5 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        <div>
          <FieldLabel required>
            <span className="flex items-center gap-1.25">
              <MapPin className="w-2.75 h-2.75" />
              Location
            </span>
          </FieldLabel>
          <FormSelect value={form.location} onChange={(e) => setField('location', e.target.value)} error={fieldErrors.location}>
            <option value="" disabled>Select</option>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </FormSelect>
        </div>

        <div>
          <FieldLabel required>
            <span className="flex items-center gap-1.25">
              <Briefcase className="w-2.75 h-2.75" />
              Work Mode
            </span>
          </FieldLabel>
          <FormSelect value={form.workMode} onChange={(e) => setField('workMode', e.target.value)} error={fieldErrors.workMode}>
            <option value="" disabled>Select</option>
            {WORK_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </FormSelect>
        </div>

        <div>
          <FieldLabel required>
            <span className="flex items-center gap-1.25">
              <Clock className="w-2.75 h-2.75" />
              Work Hours
            </span>
          </FieldLabel>
          <FormSelect value={form.workHours} onChange={(e) => setField('workHours', e.target.value)} error={fieldErrors.workHours}>
            <option value="" disabled>Select</option>
            {WORK_HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
          </FormSelect>
        </div>
      </div>

      {form.experienceLevel === 'intern' && (
        <>
          <div className="h-px bg-[#37373f] my-6" />
          <SectionLabel icon={DollarSign} text="Compensation" />
          <div className={`grid gap-4 mb-5 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <FieldLabel required>Stipend / Month INR</FieldLabel>
              <FormInput
                type="text"
                value={form.stipendSalary}
                onChange={(e) => setField('stipendSalary', e.target.value)}
                placeholder="e.g. 50000"
                error={fieldErrors.stipendSalary}
              />
            </div>
            <div>
              <FieldLabel required>Full-Time Conversion Salary INR</FieldLabel>
              <FormInput
                type="text"
                value={form.fulltimeOfferSalary}
                onChange={(e) => setField('fulltimeOfferSalary', e.target.value)}
                placeholder="e.g. 600000"
                error={fieldErrors.fulltimeOfferSalary}
              />
            </div>
          </div>
        </>
      )}

      {form.experienceLevel === 'experienced' && (
        <>
          <div className="h-px bg-[#37373f] my-6" />
          <SectionLabel icon={DollarSign} text="Compensation & Experience" />

          <div className={`grid gap-4 mb-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <FieldLabel required>
                <span className="flex items-center gap-1.25">
                  <Briefcase className="w-2.75 h-2.75" />
                  Experience Years
                </span>
              </FieldLabel>
              <FormInput
                type="text"
                value={form.yearsOfExperience}
                onChange={(e) => setField('yearsOfExperience', e.target.value)}
                placeholder="e.g. 3+ years, 5–8 years"
                error={fieldErrors.yearsOfExperience}
              />
            </div>
            <div>
              <FieldLabel>
                <span className="flex items-center gap-1.25">
                  <Award className="w-2.75 h-2.75" />
                  Relevant Experience
                </span>
              </FieldLabel>
              <FormInput
                type="text"
                value={form.relevantExperience}
                onChange={(e) => setField('relevantExperience', e.target.value)}
                placeholder="e.g. React, Node.js, REST APIs"
              />
            </div>
          </div>

          <div className="h-px bg-[#2a2d32] my-4 mb-4" />

          <div className={`grid gap-4 mb-5 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <FieldLabel>
                <span className="flex items-center gap-1.25">
                  <DollarSign className="w-2.75 h-2.75" />
                  Salary INR
                </span>
              </FieldLabel>
              <FormInput
                type="text"
                value={form.fulltimeOfferSalary}
                onChange={(e) => setField('fulltimeOfferSalary', e.target.value)}
                placeholder="e.g. 1200000"
                className="h-10.5 box-border"
                error={fieldErrors.fulltimeOfferSalary}
              />
            </div>
            <div>
              <FieldLabel required>
                <span className="flex items-center gap-1.25">
                  <Timer className="w-2.75 h-2.75" />
                  Notice Period Expected
                </span>
              </FieldLabel>
              <FormSelect
                value={form.noticePeriod}
                onChange={(e) => setField('noticePeriod', e.target.value)}
                className="h-10.5 box-border"
                error={fieldErrors.noticePeriod}
              >
                <option value="" disabled>Select</option>
                {NOTICE_PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </FormSelect>
            </div>
          </div>
        </>
      )}

      {form.experienceLevel === 'fresher' && (
        <>
          <div className="h-px bg-[#37373f] my-6" />
          <SectionLabel icon={DollarSign} text="Compensation" />
          <div className="mb-5">
            <FieldLabel required>Full-Time Offer Salary INR</FieldLabel>
            <FormInput
              type="text"
              value={form.fulltimeOfferSalary}
              onChange={(e) => setField('fulltimeOfferSalary', e.target.value)}
              placeholder="e.g. 600000"
              error={fieldErrors.fulltimeOfferSalary}
            />
          </div>
        </>
      )}

      <div className="h-px bg-[#37373f] my-6" />
      <SectionLabel icon={FileText} text="Role Description & Requirements" />
      <div className="mb-6">
        <FieldLabel>Description</FieldLabel>
        <textarea
          value={form.roleDescription}
          onChange={(e) => setField('roleDescription', e.target.value)}
          rows={6}
          placeholder="Describe the role, responsibilities, and requirements..."
          className={[
            'bg-[#1a1d20] text-white rounded-lg py-2.5 px-3.5 w-full outline-none text-sm resize-y leading-[1.7] box-border border',
            'transition-[border-color] duration-150',
            fieldErrors.roleDescription ? 'border-[#ef4444] focus:border-[#ef4444]' : 'border-[#37373f] focus:border-[#1d2ba4]',
          ].join(' ')}
          style={{ minHeight: isMobile ? 120 : 140 }}
        />
        {fieldErrors.roleDescription && (
          <p className="text-[#f87171] text-[11px] mt-1">{fieldErrors.roleDescription}</p>
        )}
        <p className="text-[#6b7280] text-[11px] mt-1.5">
          Be specific about responsibilities — the AI uses this to generate the full JD.
        </p>
      </div>
    </>
  )
}
