import { useRef, useState, useEffect, useCallback } from 'react'
import { X, Upload, FileText, Folder } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../../shared/hooks/useAuth'
import { useUploadProgress } from '../../../../shared/context/UploadProgressContext'
import { getPublishedJDs } from '../../jd-creation/api/jdApi'
import JDPickerStep from './JDPickerStep'
import type { JDDraft } from '../../../../shared/types/index'

interface UploadResumeModalProps {
  readonly onClose: () => void
  readonly isMobile?: boolean
  readonly preselectedJobId?: string
  readonly preselectedJobTitle?: string
  readonly onUploadComplete?: (failedFiles: Array<{ fileName: string; error: string }>) => void
}

type ModalStep = 'pick-jd' | 'upload-files'

function StepIndicator({ step }: { readonly step: ModalStep }) {
  const steps: { key: ModalStep; label: string }[] = [
    { key: 'pick-jd', label: 'Select JD' },
    { key: 'upload-files', label: 'Upload Files' },
  ]
  return (
    <div className="flex items-center gap-2 mb-4">
      {steps.map(({ key, label }, i) => {
        const isActive = step === key
        const isPast = step === 'upload-files' && key === 'pick-jd'
        return (
          <div key={key} className="flex items-center gap-2">
            <div className="flex items-center gap-[6px]">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isActive || isPast ? 'bg-[#1d2ba4] text-white' : 'bg-[#37373f] text-[#6b7280]'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs ${isActive ? 'text-white font-semibold' : 'text-[#6b7280] font-normal'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 h-px ${isPast ? 'bg-[#1d2ba4]' : 'bg-[#37373f]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

// dataTransfer.files is empty for dropped folders — must use the Items API + webkitGetAsEntry
async function readEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise<File[]>((resolve) => {
      (entry as FileSystemFileEntry).file((f) => resolve([f]), () => resolve([]))
    })
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    const all: File[] = []
    // readEntries returns ≤100 results per call — loop until empty to get all entries
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((res, rej) =>
        reader.readEntries(res, rej)
      )
      if (batch.length === 0) break
      const nested = await Promise.all(batch.map(readEntry))
      all.push(...nested.flat())
    }
    return all
  }
  return []
}

export function UploadResumeModal({ onClose, isMobile: isMobileModal = false, preselectedJobId, preselectedJobTitle, onUploadComplete }: UploadResumeModalProps) {
  const { user } = useAuth()
  const { startUpload } = useUploadProgress()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<ModalStep>(preselectedJobId ? 'upload-files' : 'pick-jd')
  const [selectedJd, setSelectedJd] = useState<JDDraft | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)

  const jdsQuery = useQuery({
    queryKey: ['published-jds', user?.username],
    queryFn: () => getPublishedJDs(user?.username ?? ''),
    enabled: !!user?.username,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '')
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const addFiles = useCallback((incoming: File[]) => {
    const accepted = incoming.filter(f => /\.(pdf|doc|docx)$/i.exec(f.name) !== null)
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size))
      return [...prev, ...accepted.filter(f => !existing.has(f.name + f.size))]
    })
  }, [])

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const items = Array.from(e.dataTransfer.items)
    const entries = items.map(i => i.webkitGetAsEntry()).filter((e): e is FileSystemEntry => e !== null)
    if (entries.length > 0) {
      const nested = await Promise.all(entries.map(readEntry))
      addFiles(nested.flat())
    } else {
      addFiles(Array.from(e.dataTransfer.files))
    }
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  function handleUpload() {
    if (files.length === 0) return
    startUpload(files, preselectedJobId ?? selectedJd?.id, onUploadComplete
      ? (result) => {
          const failed = result.results
            .filter(r => r.error !== null)
            .map(r => ({ fileName: r.fileName, error: r.error! }))
          if (failed.length > 0) onUploadComplete(failed)
        }
      : undefined)
    onClose()
  }

  const ghostBtnClass = 'py-2 px-4 border border-[#37373f] rounded-lg bg-transparent text-[13px] text-[#9ca3af] cursor-pointer hover:border-[#6b7280] transition-[border-color] duration-150'

  function renderFooter() {
    if (step === 'pick-jd') {
      return (
        <>
          <button onClick={onClose} className={ghostBtnClass}>Cancel</button>
          <button
            onClick={() => { setSelectedJd(null); setStep('upload-files') }}
            className={ghostBtnClass}
          >
            Skip
          </button>
          <button
            onClick={() => setStep('upload-files')}
            disabled={!selectedJd}
            className={`py-2 px-[18px] rounded-lg border-none text-[13px] font-semibold transition-[background,box-shadow] duration-150 ${
              selectedJd
                ? 'bg-[#1d2ba4] text-white cursor-pointer shadow-[0_4px_14px_rgba(29,43,164,0.35)] hover:bg-[#12219e]'
                : 'bg-[#37373f] text-[#6b7280] cursor-not-allowed shadow-none'
            }`}
          >
            Next
          </button>
        </>
      )
    }

    return (
      <>
        <button
          onClick={() => preselectedJobId ? onClose() : setStep('pick-jd')}
          className={ghostBtnClass}
        >
          {preselectedJobId ? 'Cancel' : 'Back'}
        </button>
        <button
          onClick={handleUpload}
          disabled={files.length === 0}
          className={`py-2 px-[18px] rounded-lg border-none text-[13px] font-semibold transition-[background,box-shadow] duration-150 ${
            files.length > 0
              ? 'bg-[#1d2ba4] text-white cursor-pointer shadow-[0_4px_14px_rgba(29,43,164,0.35)] hover:bg-[#12219e]'
              : 'bg-[#37373f] text-[#6b7280] cursor-not-allowed shadow-none'
          }`}
        >
          {files.length > 0 ? `Upload (${files.length})` : 'Upload'}
        </button>
      </>
    )
  }

  let descriptionText = 'PDF, DOC, DOCX supported. The AI will categorize each resume.'
  if (step === 'pick-jd') {
    descriptionText = 'Link this batch to a job, or skip to let the AI categorize automatically.'
  } else if (preselectedJobTitle ?? selectedJd?.jobTitle) {
    descriptionText = `Uploading for: ${preselectedJobTitle ?? selectedJd?.jobTitle}`
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-50">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 w-full h-full bg-transparent border-none cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        className={`relative bg-[#161719] border border-[#37373f] rounded-2xl w-full max-w-[520px] shadow-[0_24px_64px_rgba(0,0,0,0.5)] ${
          isMobileModal ? 'max-w-[calc(100vw-16px)] max-h-[calc(100vh-32px)] overflow-y-auto' : 'overflow-hidden'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center py-[18px] px-6 border-b border-[#37373f]">
          <div>
            <h2 className="text-[15px] font-semibold text-white m-0">Upload Resumes</h2>
            <p className="text-xs text-[#9ca3af] mt-[3px]">
              {descriptionText}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-none border-none cursor-pointer p-1 text-[#6b7280] flex hover:text-[#9ca3af] transition-colors duration-150"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="py-5 px-6">
          {!preselectedJobId && <StepIndicator step={step} />}

          {step === 'pick-jd' ? (
            <JDPickerStep
              jds={jdsQuery.data ?? []}
              isLoading={jdsQuery.isLoading}
              selectedId={selectedJd?.id ?? null}
              onSelect={setSelectedJd}
            />
          ) : (
            <>
              {/* Drop zone */}
              <section
                aria-label="File drop zone"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl py-8 px-6 text-center transition-all duration-150 mb-4 ${
                  dragOver ? 'border-[#1d2ba4] bg-[rgba(29,43,164,0.08)]' : 'border-[#37373f] bg-[#1a1b1e]'
                }`}
              >
                <Upload size={26} className="text-[#6ea8fe] mb-[10px] mx-auto" />
                <p className="text-sm text-[#d1d5db] mb-1">
                  Drag &amp; drop resumes or a folder here
                </p>
                <p className="text-xs text-[#6b7280] mb-4">
                  PDF, DOC, DOCX supported
                </p>
                <div className="flex gap-[10px] justify-center">
                  {[
                    { label: 'Browse Files', icon: <FileText size={13} />, ref: fileInputRef },
                    { label: 'Browse Folder', icon: <Folder size={13} />, ref: folderInputRef },
                  ].map(({ label, icon, ref }) => (
                    <button
                      key={label}
                      onClick={() => ref.current?.click()}
                      className="flex items-center gap-[6px] py-[7px] px-[14px] border border-[#37373f] rounded-lg bg-transparent text-xs text-[#9ca3af] cursor-pointer hover:border-[rgba(29,43,164,0.5)] hover:text-[#6ea8fe] transition-[border-color,color] duration-150"
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Hidden inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={e => addFiles(Array.from(e.target.files ?? []))}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={e => addFiles(Array.from(e.target.files ?? []))}
              />

              {/* Selected files list */}
              {files.length > 0 && (
                <div className="max-h-[180px] overflow-y-auto flex flex-col gap-[6px]">
                  {files.map((file, i) => (
                    <div
                      key={file.name + file.size}
                      className="flex items-center gap-[10px] py-2 px-3 bg-[#1a1b1e] border border-[#37373f] rounded-lg"
                    >
                      <FileText size={13} className="text-[#6ea8fe] shrink-0" />
                      <span className="flex-1 text-xs text-[#d1d5db] overflow-hidden text-ellipsis whitespace-nowrap">
                        {file.name}
                      </span>
                      <span className="text-[11px] text-[#6b7280] shrink-0">
                        {formatBytes(file.size)}
                      </span>
                      <button
                        onClick={() => removeFile(i)}
                        className="bg-none border-none cursor-pointer p-[2px] text-[#6b7280] flex hover:text-[#9ca3af] transition-colors duration-150"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 border-t border-[#37373f] flex-wrap ${isMobileModal ? 'py-3 px-4' : 'py-[14px] px-6'}`}>
          {renderFooter()}
        </div>
      </div>
    </div>
  )
}
