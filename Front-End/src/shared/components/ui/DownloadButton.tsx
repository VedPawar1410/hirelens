import { Download } from 'lucide-react'
import { useState } from 'react'
import { getPdf } from '../../../features/recruiter/jd-creation/api/jdApi'
import { useToast } from '../../hooks/useToast'
import { Spinner } from './Spinner'
import { ApiError } from '../../types/api'

interface Props {
  readonly draftId: string
  readonly jobTitle: string
}

export function DownloadButton({ draftId, jobTitle }: Props) {
  const [downloading, setDownloading] = useState(false)
  const { showToast } = useToast()

  async function handleDownload() {
    setDownloading(true)
    try {
      const blob = await getPdf(draftId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${jobTitle.replace(/\s+/g, '_')}_JD.pdf`
      a.click()
      // Revoke immediately after click — the browser queues the download before the URL is gone
      URL.revokeObjectURL(url)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Download failed, try again'
      showToast(msg, 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={[
        'flex items-center gap-[6px] py-[7px] px-[14px] rounded-lg text-[13px] font-semibold text-[#e5e7eb] bg-transparent border border-[#37373f]',
        'transition-[border-color] duration-150',
        downloading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[#6b7280]',
      ].join(' ')}
    >
      {downloading ? <Spinner size="sm" /> : <Download className="w-[13px] h-[13px]" />}
      {downloading ? 'Downloading...' : 'Download PDF'}
    </button>
  )
}
