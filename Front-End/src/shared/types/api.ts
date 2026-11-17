
import type { ExperienceLevel, JDStatus, JobRound, UserRole } from './index'

// Backend wraps every response in this envelope. Always unwrap with `.data`.
export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  errors: unknown
}

// Extends Error so callers can use `instanceof ApiError` to distinguish our
// typed API errors from unexpected runtime errors (e.g. TypeError, RangeError)
export class ApiError extends Error {
  status: number
  // Populated by the server on 400 responses to highlight specific form fields
  fields?: Record<string, string>

  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

// The JWT itself never reaches JS — it travels in the ATSAuth HttpOnly cookie
export interface LoginResponse {
  user: {
    id: string
    username: string
    name: string
    role: UserRole
  }
}

export interface JDPreviewResponse {
  previewJD: string
}

// Raw server shape — camelCase, nullable fields. Never use this directly in
// the UI. Always go through mapDraft() in jdApi.ts to get a JDDraft instead.
export interface ApiDraft {
  id: string
  experienceLevel: ExperienceLevel
  jobTitle: string
  location: string
  workMode: string
  workHours: string
  duration: string
  stipendSalary: string
  fulltimeOfferSalary: string
  yearsOfExperience: string
  noticePeriod: string | null
  relevantExperience: string | null
  roleDescription: string | null
  generatedJd: string | null
  assignedTo: string[] | null      // null until recruitment assigns
  interviewRounds: JobRound[] | null
  status: JDStatus
  createdBy: string
  createdAt: string
}
