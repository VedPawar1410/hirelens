import type { ReactNode } from 'react'
import { Briefcase, Download, MapPin, Building2, Users } from 'lucide-react'
import { usePdfBlobUrl } from '../../../../../shared/hooks/usePdfBlobUrl'
import { BezelCard } from '../../../../../shared/components/ui/BezelCard'
import type { Candidate } from '../../../../../shared/types/index'

interface JdData {
  jobTitle: string
  location?: string | null
  workMode?: string | null
  yearsOfExperience?: string | number | null
  generatedJd?: string | null
  roleDescription?: string | null
}

interface Props {
  readonly appliedJob: Candidate['appliedJob']
  readonly jobDescBase64: string | null
  readonly jobDescFileName: string | null
  readonly jdData: JdData | undefined
  readonly jdIsLoading: boolean
  readonly documentIsLoading?: boolean
}

export function JdCard({ appliedJob, jobDescBase64, jobDescFileName, jdData, jdIsLoading, documentIsLoading = false }: Props) {
  const jdBlobUrl = usePdfBlobUrl(jobDescBase64)

  if (!appliedJob) return null

  let jdBodyContent: ReactNode
  if (jdBlobUrl) {
    jdBodyContent = (
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <iframe
          src={`${jdBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          style={{ width: '100%', height: '420px', border: 'none', display: 'block' }}
          title={jobDescFileName ?? 'Job Description'}
        />
      </div>
    )
  } else if (jdData?.generatedJd || jdData?.roleDescription) {
    jdBodyContent = (
      <div
        className="rounded-xl p-4 max-h-105 overflow-y-auto text-[13px] leading-relaxed whitespace-pre-wrap"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#d1d5db', fontFamily: 'Sora, sans-serif' }}
      >
        {jdData.generatedJd ?? jdData.roleDescription}
      </div>
    )
  } else if (documentIsLoading) {
    jdBodyContent = <p className="text-[13px] text-[#6b7280]">Loading job description...</p>
  } else {
    jdBodyContent = <p className="text-[13px] text-[#6b7280]">JD not yet generated for this role.</p>
  }

  let jdStatusContent: ReactNode
  if (jdBlobUrl && !jdData) {
    // PDF ready but metadata not yet loaded — show PDF immediately without waiting
    jdStatusContent = jdBodyContent
  } else if (jdIsLoading) {
    jdStatusContent = <p className="text-[13px] text-[#6b7280]">Loading…</p>
  } else if (jdData) {
    jdStatusContent = (
      <>
        <p className="text-[17px] font-bold text-white tracking-[-0.01em] mb-3">{jdData.jobTitle}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2.5 mb-5">
          {jdData.location && (
            <div className="flex items-center gap-1.75">
              <MapPin size={12} className="text-[#6b7280] shrink-0" />
              <span className="text-[12px] text-[#9ca3af]">{jdData.location}</span>
            </div>
          )}
          {jdData.workMode && (
            <div className="flex items-center gap-1.75">
              <Building2 size={12} className="text-[#6b7280] shrink-0" />
              <span className="text-[12px] text-[#9ca3af]">{jdData.workMode}</span>
            </div>
          )}
          {jdData.yearsOfExperience && (
            <div className="flex items-center gap-1.75">
              <Users size={12} className="text-[#6b7280] shrink-0" />
              <span className="text-[12px] text-[#9ca3af]">{jdData.yearsOfExperience} yrs exp</span>
            </div>
          )}
        </div>
        <div className="pt-4 border-t border-[#2a2b2e]">
          {jdBodyContent}
        </div>
      </>
    )
  } else {
    jdStatusContent = <p className="text-[13px] text-[#6b7280]">Could not load job description.</p>
  }

  return (
    <BezelCard>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Briefcase size={15} className="text-[#6b7280]" />
          <span className="text-[14px] font-semibold text-white">Job Description</span>
        </div>
        {jobDescBase64 && jobDescFileName && (
          <a
            href={`data:application/pdf;base64,${jobDescBase64}`}
            download={jobDescFileName}
            className="inline-flex items-center gap-1.25 text-[11px] font-medium py-1 px-2.5 rounded-[7px] cursor-pointer"
            style={{ color: '#6ea8fe', background: 'rgba(110,168,254,0.08)', border: '1px solid rgba(110,168,254,0.2)', textDecoration: 'none' }}
          >
            <Download size={11} />
            Download
          </a>
        )}
      </div>
      {jdStatusContent}
    </BezelCard>
  )
}
