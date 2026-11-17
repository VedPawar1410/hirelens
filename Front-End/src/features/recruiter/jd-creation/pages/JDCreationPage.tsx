import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../../shared/hooks/useAuth'
import { useToast } from '../../../../shared/hooks/useToast'
import { useJDMutations } from '../hooks/useJDMutations'
import { useJDForm } from '../hooks/useJDForm'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'
import { getDrafts } from '../api/jdApi'
import { DRAFTS_ALL_QUERY_KEY } from '../queryKeys'
import { JDPreviewModal } from '../../../../shared/components/modals/JDPreviewModal'
import { ExperienceLevelSelector } from '../components/ExperienceLevelSelector'
import { LiveSummaryPanel } from '../components/LiveSummaryPanel'
import { ReturnedDraftsSection } from '../components/ReturnedDraftsSection'
import { JDGeneratingOverlay } from '../components/JDGeneratingOverlay'
import { FormActionsPanel } from '../components/FormActionsPanel'
import { JDListSection } from '../components/JDListSection'
import type { JDDraft } from '../../../../shared/types'

export default function JDCreationPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { isMobile } = useBreakpoints()

  const [showJdList, setShowJdList] = useState(false)
  const [previewDraftId, setPreviewDraftId] = useState<string | null>(null)
  const [previewJD, setPreviewJD] = useState('')
  const [previewDraft, setPreviewDraft] = useState<JDDraft | null>(null)
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())
  const copyTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => { copyTimersRef.current.forEach(clearTimeout) }, [])

  const { data: allDrafts = [], isLoading } = useQuery({
    queryKey: DRAFTS_ALL_QUERY_KEY,
    queryFn: () => getDrafts({}),
    enabled: !!user,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })

  const {
    form, setForm, editingId, setEditingId,
    fieldErrors, setFieldErrors,
    getAutoSavedLabel, setField, handleSelectLevel,
    getFieldProgress, isFormComplete, validateForm, buildPayload, resetForm,
  } = useJDForm()

  const returnedDrafts = allDrafts.filter((d) => d.status === 'returned' && d.createdBy === user?.username)

  const {
    assignMutation,
    generateFromFormMutation,
    updateAndGenerateMutation,
    generateFromDraftMutation,
    deleteDraftMutation,
    generatingDraftId,
  } = useJDMutations({
    queryKey: DRAFTS_ALL_QUERY_KEY,
    showToast,
    setFieldErrors,
    onAssignSuccess: (assignedTo) => {
      showToast(`Assigned to ${assignedTo.join(', ')} — visible in their portal.`, 'success')
      resetForm()
    },
    onGenerateSuccess: (draft, jd) => {
      setPreviewDraftId(draft.id)
      setPreviewJD(jd)
      setPreviewDraft(draft)
      resetForm()
    },
  })

  function handleAssign() {
    if (!user || !form.experienceLevel || form.assignedTo.length === 0) return
    if (!validateForm()) return
    assignMutation.mutate({ payload: buildPayload(), editId: editingId })
  }

  function handleCreateJDFromForm() {
    if (!user || !form.experienceLevel) return
    if (!validateForm(true)) return
    if (editingId) {
      updateAndGenerateMutation.mutate({ id: editingId, payload: buildPayload() })
    } else {
      generateFromFormMutation.mutate(buildPayload())
    }
  }

  function handleCreateJDFromDraft(draftId: string) {
    generateFromDraftMutation.mutate(draftId)
  }

  function handleEditReturned(draft: JDDraft) {
    setForm({
      experienceLevel: draft.experienceLevel,
      jobTitle: draft.jobTitle,
      location: draft.location,
      workMode: draft.workMode,
      workHours: draft.workHours,
      duration: draft.duration,
      stipendSalary: draft.stipendSalary,
      fulltimeOfferSalary: draft.fulltimeOfferSalary,
      yearsOfExperience: draft.yearsOfExperience,
      noticePeriod: draft.noticePeriod,
      relevantExperience: draft.relevantExperience,
      roleDescription: draft.roleDescription,
      assignedTo: draft.assignedTo,
      interviewRounds: draft.interviewRounds,
    })
    setEditingId(draft.id)
    setFieldErrors({})
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  async function handleCopyJD(id: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedIds((prev) => new Set(prev).add(id))
    const t = setTimeout(() => setCopiedIds((prev) => { const next = new Set(prev); next.delete(id); return next }), 2000)
    copyTimersRef.current.push(t)
  }

  const hasForm = form.experienceLevel !== null
  const isGeneratingFromForm = generateFromFormMutation.isPending || updateAndGenerateMutation.isPending
  const isGeneratingFromDraft = generateFromDraftMutation.isPending
  const isAssigning = assignMutation.isPending
  const isBusy = isAssigning || isGeneratingFromForm || isGeneratingFromDraft

  const canAssign = form.assignedTo.length > 0 && !!form.jobTitle && !isBusy
  const canCreate = !isBusy && isFormComplete()

  const nonReturnedDrafts = allDrafts
    .filter((d) => d.status !== 'returned')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const { filled: fieldsFilled, total: fieldsTotal } = getFieldProgress()
  const autoSavedLabel = getAutoSavedLabel()

  return (
    <div className={`min-h-screen relative z-1 ${isMobile ? 'p-4' : 'py-5 px-7'}`}>
      <JDGeneratingOverlay
        isVisible={isGeneratingFromForm || isGeneratingFromDraft}
        jobTitle={
          isGeneratingFromForm
            ? (form.jobTitle || undefined)
            : (allDrafts.find((d) => d.id === generatingDraftId)?.jobTitle || undefined)
        }
      />

      <div className="mb-6 animate-[fade-up_0.45s_cubic-bezier(0.34,1.56,0.64,1)_both]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 mb-2 py-0.75 px-2.5 rounded-full bg-[rgba(29,43,164,0.12)] border border-[rgba(29,43,164,0.25)]">
              <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#6ea8fe]">
                AI-Powered · Direction A
              </span>
            </div>
            <h1 className={`font-bold text-white m-0 tracking-[-0.015em] ${isMobile ? 'text-[22px]' : 'text-[26px]'}`}>
              JD Creation
            </h1>
            <p className="text-sm text-[#9ca3af] mt-1.5 tracking-[0.01em]">
              Create and manage job descriptions for open positions
            </p>
          </div>
          {autoSavedLabel && !isMobile && (
            <p className="text-[11px] text-[#4b5563] mt-7.5 shrink-0 tabular-nums">{autoSavedLabel}</p>
          )}
        </div>
      </div>

      {previewDraftId && previewJD && previewDraft && (
        <JDPreviewModal
          draftId={previewDraftId}
          previewJD={previewJD}
          draft={previewDraft}
          queryKey={DRAFTS_ALL_QUERY_KEY}
          onClose={() => { setPreviewDraftId(null); setPreviewJD(''); setPreviewDraft(null) }}
        />
      )}

      <div>
        <ReturnedDraftsSection
          drafts={returnedDrafts}
          generatingDraftId={generatingDraftId}
          onReview={handleEditReturned}
          onCreateJD={handleCreateJDFromDraft}
          onDelete={(id) => deleteDraftMutation.mutate(id)}
          isDeleting={deleteDraftMutation.isPending}
        />
      </div>

      <div>
        <ExperienceLevelSelector
          selected={form.experienceLevel}
          onSelect={handleSelectLevel}
          fieldsFilled={fieldsFilled}
          fieldsTotal={fieldsTotal}
        />
      </div>

      {hasForm && (
        <div className={`flex gap-5 items-start ${isMobile ? 'flex-col' : 'flex-row'}`}>
          <div className="flex-1 min-w-0 w-full">
            <FormActionsPanel
              form={form}
              setField={setField}
              fieldErrors={fieldErrors}
              isMobile={isMobile}
              canAssign={canAssign}
              canCreate={canCreate}
              isAssigning={isAssigning}
              isGeneratingFromForm={isGeneratingFromForm}
              isBusy={isBusy}
              onAssign={handleAssign}
              onCreate={handleCreateJDFromForm}
            />
          </div>

          {!isMobile && (
            <div className="shrink-0">
              <LiveSummaryPanel
                form={form}
                isComplete={isFormComplete()}
                fieldsFilled={fieldsFilled}
                fieldsTotal={fieldsTotal}
              />
            </div>
          )}
        </div>
      )}

      <div>
        <JDListSection
          drafts={nonReturnedDrafts}
          isLoading={isLoading}
          copiedIds={copiedIds}
          isMobile={isMobile}
          showJdList={showJdList}
          onToggleList={() => setShowJdList((v) => !v)}
          generatingDraftId={generatingDraftId}
          isDeleting={deleteDraftMutation.isPending}
          onCopy={handleCopyJD}
          onEditFinalized={(draft) => { setPreviewDraftId(draft.id); setPreviewJD(draft.roleDescription); setPreviewDraft(draft) }}
          onRetryGenerate={handleCreateJDFromDraft}
          onDelete={(id) => deleteDraftMutation.mutate(id)}
        />
      </div>
    </div>
  )
}
