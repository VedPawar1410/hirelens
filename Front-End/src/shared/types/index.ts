export type UserRole = 'recruitment' | 'interviewer'

export type CandidateStatus =
  | 'under_review'
  | 'filtered'
  | 'shortlisted'
  | 'interviewing'
  | 'selected'
  | 'rejected'

export type JobFolderStatus = 'active' | 'closed' | 'paused'

// One configured interview round for a job. `order` is the 1-based round number.
export interface JobRound {
  order: number
  name: string
  type: string
}

export type ApplicationSource = 'LinkedIn API' | 'Direct Upload'

export interface DashboardStats {
  activeJobs: number
  totalApplications: number
  aiMatches: number
  interviewsPending: number
}

export interface ApplicationVolumeDay {
  day: string
  apps: number
}

export interface TopCandidate {
  name: string
  avatarUrl: string | null
}

export interface JobFolder {
  id: string
  jobTitle: string
  department: string
  location: string
  candidatesCount: number
  filteredCount: number
  status: JobFolderStatus
  createdAt: string
  topCandidates: TopCandidate[]
  applicationHistory: number[]
}

export interface AppliedJob {
  id: string
  title: string
}

export interface Candidate {
  id: string
  name: string
  currentRole: string
  avatarUrl: string | null
  matchScore: number | null
  isDuplicate: boolean
  appliedJob: AppliedJob | null
  applicationSource: ApplicationSource
  status: CandidateStatus
  // Round name the candidate is currently on (set by the API only while interviewing).
  currentRound?: string | null
  appliedDate: string
  email: string | null
  phone: string | null
  linkedIn: string | null
  gitHub: string | null
  skills: string[] | null
  experience: number | null
  education: string | null
}

export interface CandidateDetail extends Candidate {
  skippedRounds: number[]
  resumeBase64: string | null
  jobDescBase64: string | null
  resumeFileName: string | null
  jobDescFileName: string | null
}
export type ExperienceLevel = 'intern' | 'fresher' | 'experienced'

// JD lifecycle: draft (saved, hidden) → assigned (interviewer can see it) →
// returned (interviewer submitted role description) → finalized (recruitment approved)
export type JDStatus = 'draft' | 'assigned' | 'returned' | 'finalized'

export interface User {
  id: string
  username: string
  role: UserRole
  name: string
}

// Frontend-facing draft shape. All fields non-nullable — nulls are normalized
// in mapDraft() so the rest of the app doesn't have to guard against them.
export interface JDDraft {
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
  noticePeriod: string
  relevantExperience: string
  roleDescription: string
  generatedJd: string
  assignedTo: string[]
  interviewRounds: JobRound[]
  status: JDStatus
  createdBy: string
  createdAt: string
}

export interface CandidateNote {
  noteId: string
  authorId: string
  authorName: string
  text: string
  createdAt: string
}
