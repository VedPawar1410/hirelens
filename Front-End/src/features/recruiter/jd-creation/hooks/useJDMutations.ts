import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createDraft,
  updateDraft,
  deleteDraft,
  generatePreview,
} from '../api/jdApi'
import { ApiError } from '../../../../shared/types/api'
import type { CreateDraftPayload } from '../api/jdApi'
import type { JDDraft } from '../../../../shared/types'
import type { ToastType } from '../../../../shared/components/Toast/Toast'

interface Options {
  queryKey: readonly unknown[]
  showToast: (msg: string, type: ToastType) => void
  setFieldErrors: (errors: Record<string, string>) => void
  onAssignSuccess: (assignedTo: string[]) => void
  onGenerateSuccess: (draft: JDDraft, previewJD: string) => void
}

export function useJDMutations({
  queryKey,
  showToast,
  setFieldErrors,
  onAssignSuccess,
  onGenerateSuccess,
}: Options) {
  const queryClient = useQueryClient()

  // Tracks which draft row is currently spinning while generating from the list
  const [generatingDraftId, setGeneratingDraftId] = useState<string | null>(null)

  const handleApiError = useCallback((err: unknown, fallback: string) => {
    // 400 with field-level errors → highlight the bad fields inline
    if (err instanceof ApiError && err.status === 400 && err.fields) {
      setFieldErrors(err.fields)
    } else {
      showToast(fallback, 'error')
    }
  }, [setFieldErrors, showToast])

  const assignMutation = useMutation({
    mutationFn: async ({ payload, editId }: { payload: CreateDraftPayload; editId: string | null }) => {
      if (editId) {
        // Single PATCH — fields + assignedTo + status in one round trip
        await updateDraft(editId, payload, true)
      } else {
        // Single POST — assignedTo included in body, backend sets status="assigned"
        await createDraft(payload)
      }
      return payload.assignedTo ?? []
    },
    onSuccess: (assignedTo) => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['drafts', 'interviewer'] })
      if (assignedTo.length > 0) onAssignSuccess(assignedTo)
    },
    onError: (err) => handleApiError(err, 'Failed to assign, please try again.'),
  })

  const generateFromFormMutation = useMutation({
    mutationFn: async (payload: CreateDraftPayload) => {
      const draft = await createDraft(payload)
      const { previewJD } = await generatePreview(draft.id)
      return { draft, previewJD }
    },
    onSuccess: ({ draft, previewJD }) => {
      queryClient.invalidateQueries({ queryKey })
      onGenerateSuccess(draft, previewJD)
    },
    onError: (err) => handleApiError(err, 'Failed to generate JD, please try again.'),
  })

  const updateAndGenerateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CreateDraftPayload }) => {
      const draft = await updateDraft(id, payload)
      const { previewJD } = await generatePreview(id)
      return { draft, previewJD }
    },
    onMutate: ({ id }) => { setGeneratingDraftId(id) },
    onSuccess: ({ draft, previewJD }) => {
      queryClient.invalidateQueries({ queryKey })
      onGenerateSuccess(draft, previewJD)
      setGeneratingDraftId(null)
    },
    onError: (err) => {
      handleApiError(err, 'Failed to generate JD, please try again.')
      setGeneratingDraftId(null)
    },
  })

  const generateFromDraftMutation = useMutation({
    mutationFn: async (draftId: string) => {
      const { previewJD } = await generatePreview(draftId)
      return previewJD
    },
    onMutate: (draftId) => { setGeneratingDraftId(draftId) },
    onSuccess: (previewJD, draftId) => {
      const cached = queryClient.getQueryData<JDDraft[]>(queryKey)
      const draft = cached?.find(d => d.id === draftId)
      if (!draft) {
        showToast('Failed to load draft data, please try again.', 'error')
        setGeneratingDraftId(null)
        return
      }
      onGenerateSuccess(draft, previewJD)
      setGeneratingDraftId(null)
    },
    onError: () => {
      showToast('Failed to load JD, please try again.', 'error')
      setGeneratingDraftId(null)
    },
  })

  const deleteDraftMutation = useMutation({
    mutationFn: (id: string) => deleteDraft(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => showToast('Failed to delete, please try again.', 'error'),
  })

  return {
    assignMutation,
    generateFromFormMutation,
    updateAndGenerateMutation,
    generateFromDraftMutation,
    deleteDraftMutation,
    generatingDraftId,
  }
}
