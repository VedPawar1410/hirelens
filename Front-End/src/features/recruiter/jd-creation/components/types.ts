import type { ExperienceLevel, JobRound } from '../../../../shared/types'

// Form state for the JD creation form. Shared between JobPostingPage and its
// sub-components so props stay typed without re-declaring the shape everywhere.
export interface JDFormState {
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

export const EMPTY_FORM: JDFormState = {
  experienceLevel: null,
  jobTitle: '',
  location: '',
  workMode: '',
  workHours: '',
  duration: '',
  stipendSalary: '',
  fulltimeOfferSalary: '',
  yearsOfExperience: '',
  noticePeriod: '',
  relevantExperience: '',
  roleDescription: '',
  assignedTo: [],
  interviewRounds: [],
}
