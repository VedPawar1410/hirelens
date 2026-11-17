import type { ReactNode } from 'react'
import { FileText, Download } from 'lucide-react'
import { BezelCard } from '../../../../../shared/components/ui/BezelCard'
import type { CandidateDetail } from '../../../../../shared/types/index'

export function ResumeCard({
  candidate,
  resumeBlobUrl,
  isLoading,
}: Readonly<{
  candidate: CandidateDetail | null
  resumeBlobUrl: string | null
  isLoading: boolean
}>) {
  let resumeContent: ReactNode
  if (isLoading) {
    resumeContent = <p className="text-[13px] m-0" style={{ color: '#6b7280' }}>Loading resume…</p>
  } else if (resumeBlobUrl) {
    resumeContent = (
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <iframe
          src={`${resumeBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          style={{ width: '100%', height: 520, border: 'none', display: 'block' }}
          title={candidate?.resumeFileName ?? 'Resume'}
        />
      </div>
    )
  } else {
    resumeContent = (
      <div className="rounded-xl flex flex-col items-center justify-center gap-3 py-14"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(156,163,175,0.08)' }}>
          <FileText size={20} style={{ color: '#6b7280' }} />
        </div>
        <p className="text-[13px] text-center m-0" style={{ color: '#6b7280' }}>No resume available.</p>
      </div>
    )
  }

  return (
    <BezelCard>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#6b7280] m-0">Resume</p>
        {candidate?.resumeBase64 && candidate?.resumeFileName && (
          <a
            href={`data:application/pdf;base64,${candidate.resumeBase64}`}
            download={candidate.resumeFileName}
            className="inline-flex items-center gap-1.25 text-[11px] font-medium py-1 px-2.5 rounded-[7px] no-underline"
            style={{ color: '#6ea8fe', background: 'rgba(110,168,254,0.08)', border: '1px solid rgba(110,168,254,0.2)' }}
          >
            <Download size={11} />Download
          </a>
        )}
      </div>
      {resumeContent}
    </BezelCard>
  )
}
