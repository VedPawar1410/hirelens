import { apiFetch } from '../../../../shared/api/apiClient'

export interface Interview {
  interviewId: string
  candidateId: string
  jobId: string
  interviewerId: string
  scheduledAt: string
  durationMinutes: number
  interviewType: string
  interviewRound: number
  roundName: string
  meetingLink: string | null
  location: string | null
  status: string
  overallRating: number | null
  recommendation: string | null
  feedbackNotes: string | null
  noShowReason: string | null
  rescheduleCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateInterviewDto {
  candidateId: string
  jobId: string
  interviewerId: string
  scheduledAt: string
  durationMinutes?: number
  interviewType: string
  interviewRound: number
  roundName: string
  meetingLink?: string
  location?: string
  interviewMode: 'online' | 'offline' | 'hybrid'
  resumeBase64?: string | null
  jdBase64?: string | null
}

export interface ScheduleRoundEmailStatus {
  status: string
  recipient: string
  timestamp: string
  error: string | null
}

export interface ScheduleRoundResponse {
  message: string
  data: {
    success: boolean
    message: string
    data: {
      candidateEmailStatus: ScheduleRoundEmailStatus
      interviewerEmailStatus: ScheduleRoundEmailStatus
    }
    error: string | null
  }
  interview: Interview
}

export interface SubmitFeedbackDto {
  overallRating: number
  recommendation?: string
  feedbackNotes?: string
}

export interface RescheduleInterviewDto {
  scheduledAt?: string
  durationMinutes?: number
  interviewerId?: string
  meetingLink?: string
  interviewType?: string
  interviewRound?: number
  resumeBase64: string
  jdBase64: string
  additionalInstructions?: string
}

export async function rescheduleInterview(
  interviewId: string,
  dto: RescheduleInterviewDto,
): Promise<{ message: string; interview: Interview }> {
  return apiFetch(`/interviews/${interviewId}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  })
}

// Enriched interview shape returned by the interviewer dashboard endpoint.
// The backend joins Candidate + Job to include display fields.
export interface InterviewWithDetails extends Interview {
  candidateName: string | null
  candidateRole: string | null
  candidateMatchScore: number | null
  candidateAvatarUrl: string | null
  candidateSkills: string[] | null
  jobTitle: string | null
}

export async function getInterviewsByCandidate(candidateId: string, jobId: string): Promise<Interview[]> {
  return apiFetch(`/interviews/candidate/${candidateId}?jobId=${encodeURIComponent(jobId)}`)
}

export async function getInterviewsByInterviewer(interviewerId: string): Promise<InterviewWithDetails[]> {
  return apiFetch(`/interviews/interviewer/${interviewerId}`)
}

export async function createInterview(dto: CreateInterviewDto): Promise<Interview> {
  return apiFetch('/interviews', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

export async function scheduleRound(dto: CreateInterviewDto): Promise<ScheduleRoundResponse> {
  return apiFetch('/interviews/schedule-round', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

interface SkipRoundResponse {
  skippedRounds: number[]
}

export async function skipRound(candidateId: string, jobId: string, round: number): Promise<number[]> {
  const res = await apiFetch<SkipRoundResponse>('/interviews/skip-round', {
    method: 'POST',
    body: JSON.stringify({ candidateId, jobId, round }),
  })
  return res.skippedRounds
}

export async function unskipRound(candidateId: string, jobId: string, round: number): Promise<number[]> {
  const res = await apiFetch<SkipRoundResponse>('/interviews/unskip-round', {
    method: 'POST',
    body: JSON.stringify({ candidateId, jobId, round }),
  })
  return res.skippedRounds
}

export interface UpcomingInterviewsSummary {
  count: number
  nextInterviewAt: string | null
  nextCandidateName: string | null
  nextCandidateId: string | null
  nextJobId: string | null
}

export async function getUpcomingInterviews(hours = 24): Promise<UpcomingInterviewsSummary> {
  return apiFetch<UpcomingInterviewsSummary>(`/interviews/upcoming?hours=${hours}`)
}

export async function submitInterviewFeedback(
  interviewId: string,
  dto: SubmitFeedbackDto
): Promise<Interview> {
  return apiFetch(`/interviews/${interviewId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}
