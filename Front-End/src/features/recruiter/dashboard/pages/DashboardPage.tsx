import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Briefcase, FileText, CheckCircle2, Clock, Upload, Plus } from 'lucide-react'
import { useAuth } from '../../../../shared/hooks/useAuth'
import {
  getDashboardStats,
  getApplicationVolume,
  getRecentJobFolders,
  getPipelineFunnel,
  getAttentionItems,
} from '../api/dashboardApi'
import { StatCard } from '../../../../shared/components/ui/StatCard'
import ApplicationVolumeChart from '../components/ApplicationVolumeChart'
import RecentJobFolders from '../components/RecentJobFolders'
import PipelineFunnelPanel from '../components/PipelineFunnelPanel'
import NeedsAttentionPanel from '../components/NeedsAttentionPanel'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'
import { getGreeting } from '../../../../shared/lib/dateUtils'
import type { ApplicationVolumeDay } from '../../../../shared/types/index'
import type { AttentionItem } from '../api/dashboardApi'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')
  const { isCompact: isMobile, isCompactTablet: isTablet } = useBreakpoints()

  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    staleTime: 60_000,
  })

  const volumeQuery = useQuery({
    queryKey: ['dashboard', 'application-volume', period],
    queryFn: () => getApplicationVolume(period),
    staleTime: 60_000,
  })

  const foldersQuery = useQuery({
    queryKey: ['dashboard', 'recent-job-folders'],
    queryFn: getRecentJobFolders,
    staleTime: 60_000,
  })

  const funnelQuery = useQuery({
    queryKey: ['dashboard', 'pipeline-funnel'],
    queryFn: getPipelineFunnel,
    staleTime: 60_000,
  })

  const attentionQuery = useQuery({
    queryKey: ['dashboard', 'attention-items'],
    queryFn: getAttentionItems,
    staleTime: 60_000,
  })

  const stats = statsQuery.data
  const volumeData: ApplicationVolumeDay[] = volumeQuery.data ?? []

  let containerPadding = 'px-8 pt-7 pb-5'
  if (isMobile) containerPadding = 'px-4 pt-[14px] pb-[10px]'
  else if (isTablet) containerPadding = 'px-6 pt-5 pb-4'
  const statGridClass = isMobile ? 'grid-cols-2 gap-2 mb-[10px]' : 'grid-cols-4 gap-3 mb-[14px]'
  const iconSize = isMobile ? 15 : 17
  const middleRowClass = isMobile ? 'flex flex-col gap-3' : 'grid gap-3'
  const middleRowStyle = isMobile ? undefined : { gridTemplateColumns: '3fr 2fr', height: isTablet ? 300 : 340 }
  const chartStyle = isMobile ? { height: 260 } : { height: '100%' }
  const funnelStyle = isMobile ? { height: 280 } : { height: '100%' }
  const bottomRowClass = isMobile ? 'flex flex-col gap-3' : 'grid gap-3 items-start'
  const bottomRowStyle = isMobile ? undefined : { gridTemplateColumns: '3fr 2fr' }

  function handleReview(item: AttentionItem) {
    if (item.nextCandidateId) {
      navigate({
        to: '/recruitment/candidates/$candidateId',
        params: { candidateId: item.nextCandidateId },
        search: { jobId: item.nextJobId ?? undefined, fromJobFolder: undefined, stage: undefined, prevId: undefined, nextId: undefined },
      })
      return
    }
    const searchMap: Record<string, { status: string | undefined; filter: 'topAts' | undefined }> = {
      pending_review:      { status: 'under_review', filter: undefined },
      ai_matches:          { status: undefined, filter: 'topAts' },
      upcoming_interviews: { status: undefined, filter: undefined },
      shortlisted_pending: { status: 'shortlisted', filter: undefined },
    }
    navigate({
      to: '/recruitment/candidates',
      search: searchMap[item.type] ?? { status: undefined, filter: undefined },
    })
  }

  return (
    <div
      className={`relative z-1 flex flex-col overflow-y-auto overflow-x-hidden box-border ${containerPadding}`}
    >
      {/* Page header */}
      <div className="mb-5 shrink-0 animate-[fade-up_0.45s_cubic-bezier(0.34,1.56,0.64,1)_both] flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 mb-2 py-0.75 px-2.5 rounded-full bg-[rgba(29,43,164,0.12)] border border-[rgba(29,43,164,0.25)]">
            <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#6ea8fe]">Live Overview</span>
          </div>
          <h1 className="text-[26px] font-bold text-white m-0 tracking-[-0.015em]">
            Recruiter Dashboard
          </h1>
          <p className="text-sm text-[#9ca3af] mt-1.5 tracking-[0.01em]">
            {getGreeting()}{user?.name ? `, ${user.name}` : ''} — here's your pipeline at a glance.
          </p>
        </div>

        {/* Header action buttons */}
        {!isMobile && (
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <button
              onClick={() => navigate({ to: '/recruitment/candidates', search: { status: undefined, filter: undefined } })}
              className="flex items-center gap-1.5 px-3.5 py-1.75 rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[#9ca3af] text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-[rgba(255,255,255,0.07)] hover:text-white hover:border-[rgba(255,255,255,0.15)]"
            >
              <Upload size={14} />
              Import resumes
            </button>
            <button
              onClick={() => navigate({ to: '/recruitment/jd-creation' })}
              className="flex items-center gap-1.5 px-3.5 py-1.75 rounded-[10px] bg-[#1d2ba4] border border-[rgba(99,102,241,0.4)] text-white text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:bg-[#2233cc] hover:border-[rgba(99,102,241,0.6)]"
              style={{ boxShadow: '0 0 16px rgba(29,43,164,0.35)' }}
            >
              <Plus size={14} />
              New JD
            </button>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className={`grid shrink-0 ${statGridClass}`}>
        <StatCard
          icon={<Briefcase size={iconSize} className="text-[#6ea8fe]" />}
          iconBg="rgba(29,43,164,0.15)"
          value={stats?.activeJobs ?? null}
          label="Active Jobs"
          onClick={() => navigate({ to: '/recruitment/jobs' })}
          compact={isMobile}
          animDelay={60}
        />
        <StatCard
          icon={<FileText size={iconSize} className="text-[#a78bfa]" />}
          iconBg="rgba(139,92,246,0.15)"
          value={stats?.totalApplications ?? null}
          label="Total Applications"
          onClick={() => navigate({ to: '/recruitment/candidates', search: { status: undefined, filter: undefined } })}
          compact={isMobile}
          animDelay={120}
        />
        <StatCard
          icon={<CheckCircle2 size={iconSize} className="text-[#22c55e]" />}
          iconBg="rgba(20,83,45,0.2)"
          value={stats?.aiMatches ?? null}
          label="AI Matches (>80%)"
          onClick={() => navigate({ to: '/recruitment/candidates', search: { status: undefined, filter: undefined } })}
          compact={isMobile}
          animDelay={180}
        />
        <StatCard
          icon={<Clock size={iconSize} className="text-[#d97706]" />}
          iconBg="rgba(217,119,6,0.2)"
          value={stats?.interviewsPending ?? null}
          label="Interviews pending"
          compact={isMobile}
          animDelay={240}
        />
      </div>

      {/* Middle row: chart + pipeline funnel */}
      <div
        className={`shrink-0 mb-3.5 ${middleRowClass}`}
        style={middleRowStyle}
      >
        <div style={chartStyle} className="flex flex-col">
          <ApplicationVolumeChart
            data={volumeData}
            isLoading={volumeQuery.isLoading}
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>
        <div style={funnelStyle} className="flex flex-col">
          <PipelineFunnelPanel
            data={funnelQuery.data}
            isLoading={funnelQuery.isLoading}
            onDetailsClick={() => navigate({ to: '/recruitment/candidates', search: { status: undefined, filter: undefined } })}
          />
        </div>
      </div>

      {/* Bottom row: recent folders + needs attention */}
      <div
        className={`shrink-0 ${bottomRowClass}`}
        style={bottomRowStyle}
      >
        <RecentJobFolders
          folders={foldersQuery.data ?? []}
          isLoading={foldersQuery.isLoading}
          onViewAll={() => navigate({ to: '/recruitment/jobs' })}
          onFolderClick={(id) => navigate({ to: '/recruitment/jobs/$jobId', params: { jobId: id }, search: { stage: undefined } })}
        />
        <NeedsAttentionPanel
          items={attentionQuery.data ?? []}
          isLoading={attentionQuery.isLoading}
          onReview={handleReview}
        />
      </div>
    </div>
  )
}
