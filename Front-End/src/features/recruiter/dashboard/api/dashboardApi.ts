import { apiFetch } from '../../../../shared/api/apiClient'
import type { DashboardStats, ApplicationVolumeDay, JobFolder } from '../../../../shared/types'
import { mapJobFolder, type ApiJobFolder } from '../../job-folders/api/jobsApi'

// ── Raw API shapes (camelCase from server) ──────────────────────────────────

interface ApiDashboardStats {
  activeJobs: number
  totalApplications: number
  aiMatches: number
  interviewsPending: number
}

interface ApiApplicationVolume {
  data: Array<{ day: string; apps: number }>
}

interface ApiRecentJobFolders {
  folders: ApiJobFolder[]
}

export interface PipelineStage {
  stage: string
  label: string
  count: number
}

export interface PipelineFunnel {
  stages: PipelineStage[]
  selectedRate: number
  avgCycleDays: number
}

export interface AttentionItem {
  type: string
  count: number
  title: string
  subtitle?: string
  actionPath: string
  nextInterviewAt?: string | null
  nextCandidateName?: string | null
  nextCandidateId?: string | null
  nextJobId?: string | null
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapStats(raw: ApiDashboardStats): DashboardStats {
  return {
    activeJobs: raw.activeJobs,
    totalApplications: raw.totalApplications,
    aiMatches: raw.aiMatches,
    interviewsPending: raw.interviewsPending,
  }
}

// ── Endpoints ─────────────────────────────────────────────────────────────────
//
// GET  /api/dashboard/stats
//   → { activeJobs, totalApplications, aiMatches, interviewsPending }
//
// GET  /api/dashboard/application-volume?period=7d|30d|90d
//   → { data: [{ day: string, apps: number }] }
//
// GET  /api/dashboard/recent-job-folders?limit=3
//   → { folders: [{ id, jobTitle, department, location, candidatesCount, status, createdAt }] }

export async function getDashboardStats(): Promise<DashboardStats> {
  const raw = await apiFetch<ApiDashboardStats>('/dashboard/stats')
  return mapStats(raw)
}

export async function getApplicationVolume(
  period: '7d' | '30d' | '90d' = '7d'
): Promise<ApplicationVolumeDay[]> {
  const raw = await apiFetch<ApiApplicationVolume>(
    `/dashboard/application-volume?period=${period}`
  )
  return raw.data
}

export async function getRecentJobFolders(): Promise<JobFolder[]> {
  const raw = await apiFetch<ApiRecentJobFolders>('/dashboard/recent-job-folders?limit=3')
  return raw.folders.map(mapJobFolder)
}

export async function getPipelineFunnel(): Promise<PipelineFunnel> {
  return apiFetch<PipelineFunnel>('/dashboard/pipeline-funnel')
}

export async function getAttentionItems(): Promise<AttentionItem[]> {
  return apiFetch<AttentionItem[]>('/dashboard/attention-items')
}
