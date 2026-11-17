import type { ReactNode } from 'react'
import { Briefcase, Download, MapPin, Building2, Users } from 'lucide-react'
import { BezelCard } from '../../../../../shared/components/ui/BezelCard'
import type { UseQueryResult } from '@tanstack/react-query'
import type { JDDraft, CandidateDetail } from '../../../../../shared/types/index'

export function JobDescCard({
  candidate,
  jdQuery,
  jdBlobUrl,
}: Readonly<{
  candidate: CandidateDetail | null
  jdQuery: UseQueryResult<JDDraft>
  jdBlobUrl: string | null
}>) {
  if (!candidate?.appliedJob) return null

  let jdBodyContent: ReactNode
  if (jdBlobUrl) {
    jdBodyContent = (
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <iframe
          src={`${jdBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          style={{ width: '100%', height: '420px', border: 'none', display: 'block' }}
          title={candidate.jobDescFileName ?? 'Job Description'}
        />
      </div>
    )
  } else if (jdQuery.data?.generatedJd ?? jdQuery.data?.roleDescription) {
    jdBodyContent = (
      <div className="rounded-xl p-4 max-h-105 overflow-y-auto text-[13px] leading-relaxed whitespace-pre-wrap"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#d1d5db' }}>
        {jdQuery.data?.generatedJd ?? jdQuery.data?.roleDescription}
      </div>
    )
  } else {
    jdBodyContent = <p className="text-[13px] m-0" style={{ color: '#6b7280' }}>JD not yet generated for this role.</p>
  }

  let queryContent: ReactNode
  if (jdQuery.isLoading) {
    queryContent = <p className="text-[13px] m-0" style={{ color: '#6b7280' }}>Loading…</p>
  } else if (jdQuery.data) {
    queryContent = (
      <>
        <p className="text-[17px] font-bold text-white tracking-[-0.01em] mb-3 m-0">
          {jdQuery.data.jobTitle}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2.5 mb-5">
          {jdQuery.data.location && (
            <div className="flex items-center gap-1.75">
              <MapPin size={12} style={{ color: '#6b7280' }} className="shrink-0" />
              <span className="text-[12px] text-[#9ca3af]">{jdQuery.data.location}</span>
            </div>
          )}
          {jdQuery.data.workMode && (
            <div className="flex items-center gap-1.75">
              <Building2 size={12} style={{ color: '#6b7280' }} className="shrink-0" />
              <span className="text-[12px] text-[#9ca3af]">{jdQuery.data.workMode}</span>
            </div>
          )}
          {jdQuery.data.yearsOfExperience && (
            <div className="flex items-center gap-1.75">
              <Users size={12} style={{ color: '#6b7280' }} className="shrink-0" />
              <span className="text-[12px] text-[#9ca3af]">{jdQuery.data.yearsOfExperience} yrs exp</span>
            </div>
          )}
        </div>
        <div className="pt-4 border-t border-[#2a2b2e]">
          {jdBodyContent}
        </div>
      </>
    )
  } else {
    queryContent = <p className="text-[13px] m-0" style={{ color: '#6b7280' }}>Could not load job description.</p>
  }

  return (
    <BezelCard>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Briefcase size={15} style={{ color: '#6b7280' }} />
          <span className="text-[14px] font-semibold text-white">Job Description</span>
        </div>
        {candidate.jobDescBase64 && candidate.jobDescFileName && (
          <a
            href={`data:application/pdf;base64,${candidate.jobDescBase64}`}
            download={candidate.jobDescFileName}
            className="inline-flex items-center gap-1.25 text-[11px] font-medium py-1 px-2.5 rounded-[7px] no-underline"
            style={{ color: '#6ea8fe', background: 'rgba(110,168,254,0.08)', border: '1px solid rgba(110,168,254,0.2)' }}
          >
            <Download size={11} />Download
          </a>
        )}
      </div>
      {queryContent}
    </BezelCard>
  )
}
