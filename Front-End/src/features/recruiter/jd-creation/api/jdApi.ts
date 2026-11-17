import { apiFetch, apiFetchBlob } from '../../../../shared/api/apiClient'
import type { ApiDraft, ApiEnvelope, JDPreviewResponse } from '../../../../shared/types/api'
import type { ExperienceLevel, JDDraft, JobRound } from '../../../../shared/types'

// Single conversion point between the server's camelCase shape (ApiDraft) and
// the camelCase JDDraft we use everywhere in the UI. Nullable server fields are
// normalized to empty strings / empty arrays here so the rest of the app never
// needs to null-check them.
function mapDraft(d: ApiDraft): JDDraft {
  return {
    id: d.id,
    experienceLevel: d.experienceLevel,
    jobTitle: d.jobTitle,
    location: d.location,
    workMode: d.workMode,
    workHours: d.workHours,
    duration: d.duration,
    stipendSalary: d.stipendSalary,
    fulltimeOfferSalary: d.fulltimeOfferSalary,
    yearsOfExperience: d.yearsOfExperience,
    noticePeriod: d.noticePeriod ?? '',
    relevantExperience: d.relevantExperience ?? '',
    roleDescription: d.roleDescription ?? '',
    generatedJd: d.generatedJd ?? '',
    assignedTo: d.assignedTo ?? [],
    interviewRounds: d.interviewRounds ?? [],
    status: d.status,
    createdBy: d.createdBy,
    createdAt: d.createdAt,
  }
}

export interface CreateDraftPayload {
  experienceLevel: ExperienceLevel | null
  jobTitle: string
  location: string
  workMode: string
  workHours: string
  duration: string
  stipendSalary: string
  fulltimeOfferSalary: string
  yearsOfExperience: string
  noticePeriod: string
  relevantExperience: string
  roleDescription: string
  assignedTo: string[]
  interviewRounds: JobRound[]
}

export async function getDraftById(id: string): Promise<JDDraft> {
  const raw = await apiFetch<ApiEnvelope<ApiDraft>>(`/drafts/${id}`)
  return mapDraft(raw.data)
}

export async function getDrafts(query: { createdBy?: string; assignedTo?: string; status?: string }): Promise<JDDraft[]> {
  const params = new URLSearchParams()
  if (query.createdBy) params.set('createdBy', query.createdBy)
  if (query.assignedTo) params.set('assignedTo', query.assignedTo)
  if (query.status) params.set('status', query.status)
  const raw = await apiFetch<ApiEnvelope<ApiDraft[]>>(`/drafts?${params.toString()}`)
  return raw.data.map(mapDraft)
}

export async function createDraft(payload: CreateDraftPayload): Promise<JDDraft> {
  const raw = await apiFetch<ApiEnvelope<ApiDraft>>('/drafts', {
    method: 'POST',
    body: JSON.stringify({
      experienceLevel: payload.experienceLevel,
      jobTitle: payload.jobTitle,
      location: payload.location,
      workMode: payload.workMode,
      workHours: payload.workHours,
      duration: payload.duration,
      stipendSalary: payload.stipendSalary,
      fulltimeOfferSalary: payload.fulltimeOfferSalary,
      yearsOfExperience: payload.yearsOfExperience,
      noticePeriod: payload.noticePeriod,
      relevantExperience: payload.relevantExperience,
      roleDescription: payload.roleDescription,
      assignedTo: payload.assignedTo,
      interviewRounds: payload.interviewRounds,
    }),
  })
  return mapDraft(raw.data)
}

export async function updateDraft(id: string, payload: CreateDraftPayload, assign = false): Promise<JDDraft> {
  const raw = await apiFetch<ApiEnvelope<ApiDraft>>(`/drafts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      experienceLevel: payload.experienceLevel,
      jobTitle: payload.jobTitle,
      location: payload.location,
      workMode: payload.workMode,
      workHours: payload.workHours,
      duration: payload.duration,
      stipendSalary: payload.stipendSalary,
      fulltimeOfferSalary: payload.fulltimeOfferSalary,
      yearsOfExperience: payload.yearsOfExperience,
      noticePeriod: payload.noticePeriod,
      relevantExperience: payload.relevantExperience,
      roleDescription: payload.roleDescription,
      interviewRounds: payload.interviewRounds,
      ...(assign && {
        assignedTo: payload.assignedTo,
        status: 'assigned',
      }),
    }),
  })
  return mapDraft(raw.data)
}

// Replaces a job's interview round config. Works for drafts and finalized jobs.
export async function updateInterviewRounds(id: string, rounds: JobRound[]): Promise<JDDraft> {
  const raw = await apiFetch<ApiEnvelope<ApiDraft>>(`/drafts/${id}/interview-rounds`, {
    method: 'PUT',
    body: JSON.stringify(rounds),
  })
  return mapDraft(raw.data)
}

export async function assignDraft(id: string, assignedTo: string[]): Promise<JDDraft> {
  const raw = await apiFetch<ApiEnvelope<ApiDraft>>(`/drafts/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedTo: assignedTo }),
  })
  return mapDraft(raw.data)
}

export async function submitRoleDescription(id: string, roleDescription: string): Promise<JDDraft> {
  const raw = await apiFetch<ApiEnvelope<ApiDraft>>(`/drafts/${id}/role-description`, {
    method: 'PATCH',
    body: JSON.stringify({ roleDescription: roleDescription }),
  })
  return mapDraft(raw.data)
}

export async function submitDraft(id: string): Promise<JDDraft> {
  // body: '{}' — the backend expects a JSON body even though there's no payload;
  // sending no body causes a 400 from the .NET middleware
  const raw = await apiFetch<ApiEnvelope<ApiDraft>>(`/drafts/${id}/submit`, { method: 'PATCH', body: '{}' })
  return mapDraft(raw.data)
}

// Calls the dedicated AI-generation endpoint once the backend implements it.
// Until then, roleDescription is populated inline by POST /drafts.
export async function generatePreview(id: string): Promise<JDPreviewResponse> {
  const raw = await apiFetch<ApiEnvelope<JDPreviewResponse>>(`/drafts/${id}/generate`, { method: 'POST', body: '{}' })
  return raw.data
}

export interface FinalizeDraftPayload {
  finalJD: string
  experienceLevel: ExperienceLevel
  jobTitle: string
  location: string
  workMode: string
  workHours: string
  duration: string
  stipendSalary: string
  fulltimeOfferSalary: string
  yearsOfExperience: string
  noticePeriod: string
  relevantExperience: string
  roleDescription: string
  assignedTo: string[]
}

export async function finalizeDraft(id: string, payload: FinalizeDraftPayload): Promise<JDDraft> {
  const raw = await apiFetch<ApiEnvelope<ApiDraft>>(`/drafts/${id}/finalize`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return mapDraft(raw.data)
}

export async function dismissDraft(id: string, username: string): Promise<JDDraft> {
  const raw = await apiFetch<ApiEnvelope<ApiDraft>>(`/drafts/${id}/dismiss`, {
    method: 'PATCH',
    body: JSON.stringify({ username }),
  })
  return mapDraft(raw.data)
}

export async function deleteDraft(id: string): Promise<void> {
  await apiFetch<void>(`/drafts/${id}`, { method: 'DELETE' })
}

export async function getPublishedJDs(createdBy: string): Promise<JDDraft[]> {
  return getDrafts({ createdBy, status: 'finalized' })
}

export async function getPdf(id: string): Promise<Blob> {
  return apiFetchBlob(`/drafts/${id}/pdf`)
}
