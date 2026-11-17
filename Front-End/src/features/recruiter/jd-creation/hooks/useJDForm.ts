import { useState, useRef, useEffect } from 'react'
import { EMPTY_FORM } from '../components/types'
import type { JDFormState } from '../components/types'
import type { ExperienceLevel } from '../../../../shared/types'
import { DEFAULT_INTERVIEW_ROUNDS } from '../../../../shared/constants/interviewConstants'
import type { CreateDraftPayload } from '../api/jdApi'

export function useJDForm() {
  const [form, setForm] = useState<JDFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced auto-save indicator — cosmetic, fires 2s after the last form change.
  // Excludes assignedTo: selecting an interviewer is not "typing", so auto-saved label would be misleading.
  useEffect(() => {
    if (!form.experienceLevel) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => setAutoSavedAt(new Date()), 2000)
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [form.experienceLevel, form.jobTitle, form.location, form.workMode, form.workHours, form.duration, form.stipendSalary, form.fulltimeOfferSalary, form.yearsOfExperience, form.noticePeriod, form.relevantExperience, form.roleDescription])

  function getAutoSavedLabel(): string | null {
    if (!autoSavedAt) return null
    const s = Math.floor((Date.now() - autoSavedAt.getTime()) / 1000)
    if (s < 10) return 'Auto-saved · just now'
    if (s < 60) return `Auto-saved · ${s}s ago`
    return `Auto-saved · ${Math.floor(s / 60)}m ago`
  }

  function setField<K extends keyof JDFormState>(key: K, value: JDFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) setFieldErrors((prev) => { const next = { ...prev }; delete next[key]; return next })
  }

  function handleSelectLevel(level: ExperienceLevel) {
    // Seed a starter round template the recruiter can edit before creating the JD.
    setForm({ ...EMPTY_FORM, experienceLevel: level, interviewRounds: DEFAULT_INTERVIEW_ROUNDS })
    setEditingId(null)
    setFieldErrors({})
    setAutoSavedAt(null)
  }

  function getLevelFields(): Array<string | null> {
    if (form.experienceLevel === 'intern')
      return [form.duration || null, form.stipendSalary || null, form.fulltimeOfferSalary || null]
    if (form.experienceLevel === 'experienced')
      return [form.yearsOfExperience || null, form.noticePeriod || null]
    if (form.experienceLevel === 'fresher')
      return [form.fulltimeOfferSalary || null]
    return []
  }

  function getFieldProgress(): { filled: number; total: number } {
    const fields = [
      form.jobTitle || null,
      form.location || null,
      form.workMode || null,
      form.workHours || null,
      form.roleDescription || null,
      ...getLevelFields(),
    ]
    return { filled: fields.filter(Boolean).length, total: fields.length }
  }

  function isFormComplete(): boolean {
    const { filled, total } = getFieldProgress()
    return total > 0 && filled === total
  }

  function validateLevelFields(errors: Record<string, string>) {
    if (form.experienceLevel === 'intern') {
      if (!form.duration)            errors.duration            = 'Duration is required.'
      if (!form.stipendSalary)       errors.stipendSalary       = 'Stipend is required.'
      if (!form.fulltimeOfferSalary) errors.fulltimeOfferSalary = 'Conversion salary is required.'
    } else if (form.experienceLevel === 'fresher') {
      if (!form.fulltimeOfferSalary) errors.fulltimeOfferSalary = 'Salary is required.'
    } else if (form.experienceLevel === 'experienced') {
      if (!form.yearsOfExperience)   errors.yearsOfExperience   = 'Experience years are required.'
      if (!form.noticePeriod)        errors.noticePeriod        = 'Notice period is required.'
    }
  }

  function validateForm(requireRoleDescription = false): boolean {
    const errors: Record<string, string> = {}
    if (!form.experienceLevel) errors.experienceLevel = 'Experience level is required.'
    if (!form.jobTitle)        errors.jobTitle        = 'Job title is required.'
    if (!form.location)        errors.location        = 'Location is required.'
    if (!form.workMode)        errors.workMode        = 'Work mode is required.'
    if (!form.workHours)       errors.workHours       = 'Work hours are required.'

    validateLevelFields(errors)

    if (requireRoleDescription && !form.roleDescription)
      errors.roleDescription = 'Role description is required to generate a JD.'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function buildPayload(): CreateDraftPayload {
    return {
      experienceLevel: form.experienceLevel!,
      jobTitle: form.jobTitle,
      location: form.location,
      workMode: form.workMode,
      workHours: form.workHours,
      duration: form.duration,
      stipendSalary: form.stipendSalary,
      fulltimeOfferSalary: form.fulltimeOfferSalary,
      yearsOfExperience: form.yearsOfExperience,
      noticePeriod: form.noticePeriod,
      relevantExperience: form.relevantExperience,
      roleDescription: form.roleDescription,
      assignedTo: form.assignedTo,
      interviewRounds: form.interviewRounds,
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFieldErrors({})
    setAutoSavedAt(null)
  }

  return {
    form, setForm,
    editingId, setEditingId,
    fieldErrors, setFieldErrors,
    getAutoSavedLabel,
    setField,
    handleSelectLevel,
    getFieldProgress,
    isFormComplete,
    validateForm,
    buildPayload,
    resetForm,
  }
}
