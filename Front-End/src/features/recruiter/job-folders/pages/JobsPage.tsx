import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Search, Plus } from 'lucide-react'
import { getJobFolders, updateJobFolderStatus } from '../api/jobsApi'
import { jobsQueryKeys } from '../api/jobsQueryKeys'
import { useBreakpoints } from '../../../../shared/hooks/useBreakpoints'
import { TableHeader, JobTableRow, MobileJobRow } from '../components/jobpage/JobRows'
import type { JobFolderStatus } from '../../../../shared/types/index'

export default function JobsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const { isMobile } = useBreakpoints()

  const foldersQuery = useQuery({
    queryKey: jobsQueryKeys.list(1),
    queryFn: () => getJobFolders(1, 200),
    staleTime: 30_000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobFolderStatus }) =>
      updateJobFolderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobsQueryKeys.all() }),
  })

  const jobsData = foldersQuery.data?.jobs
  const sorted = useMemo(
    () => [...(jobsData ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [jobsData]
  )
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(f =>
      f.jobTitle.toLowerCase().includes(q) ||
      (f.department ?? '').toLowerCase().includes(q) ||
      (f.location ?? '').toLowerCase().includes(q)
    )
  }, [sorted, search])
  const activeCount = useMemo(() => (jobsData ?? []).filter(f => f.status === 'active').length, [jobsData])
  const pausedCount = useMemo(() => (jobsData ?? []).filter(f => f.status === 'paused').length, [jobsData])

  const handleStatusChange = (id: string, status: JobFolderStatus) => statusMutation.mutate({ id, status })
  const handleRowClick = (jobId: string) =>
    navigate({ to: '/recruitment/jobs/$jobId', params: { jobId }, search: { stage: undefined } })

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', zIndex: 1, overflowX: 'hidden', padding: isMobile ? '14px 16px 24px' : '20px 28px' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}
        className="animate-[fade-up_0.45s_cubic-bezier(0.34,1.56,0.64,1)_both]"
      >
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
            padding: '3px 10px', borderRadius: 999,
            background: 'rgba(29,43,164,0.12)', border: '1px solid rgba(29,43,164,0.25)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6ea8fe' }}>
              Active Roles
            </span>
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.015em' }}>
            Job Folders
          </h1>
          <p style={{ fontSize: 14, color: '#9ca3af', marginTop: 6, letterSpacing: '0.01em' }}>
            Manage active roles and their candidate pipelines.
          </p>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexShrink: 0 }}>
            {sorted.length > 0 && (
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                <span style={{ color: '#fff', fontWeight: 500 }}>{activeCount}</span> active
                {pausedCount > 0 && <> · <span style={{ color: '#f59e0b', fontWeight: 500 }}>{pausedCount}</span> paused</>}
              </span>
            )}
            <button
              onClick={() => navigate({ to: '/recruitment/jd-creation' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                color: '#fff', background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
                border: 'none', cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg,#4338ca,#4f46e5)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg,#4f46e5,#6366f1)')}
            >
              <Plus size={14} />
              New folder
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#161719', border: '1px solid #37373f',
          borderRadius: 10, padding: '0 14px', marginBottom: 20,
          maxWidth: isMobile ? '100%' : 320, transition: 'border-color 0.15s',
        }}
      >
        <Search size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search jobs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => { (e.currentTarget.parentElement as HTMLElement).style.borderColor = '#4b5563' }}
          onBlur={e => { (e.currentTarget.parentElement as HTMLElement).style.borderColor = '#37373f' }}
          style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#d1d5db', padding: '10px 0', width: '100%', outline: 'none' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: 3 }}>
        <div style={{ background: '#161719', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          {!isMobile && <TableHeader />}

          {(() => {
            if (foldersQuery.isLoading) {
              return (
                <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="skeleton-shimmer" style={{ height: 68, borderRadius: 8 }} />
                  ))}
                </div>
              )
            }
            if (filtered.length === 0) {
              return (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                  {search ? 'No jobs match your search.' : 'No job folders yet. Create a JD in JD Creation to get started.'}
                </div>
              )
            }
            if (isMobile) {
              return filtered.map((folder, idx) => (
                <MobileJobRow
                  key={folder.id}
                  folder={folder}
                  isLast={idx === filtered.length - 1}
                  onClick={() => handleRowClick(folder.id)}
                  onStatusChange={handleStatusChange}
                />
              ))
            }
            return filtered.map((folder, idx) => (
              <JobTableRow
                key={folder.id}
                folder={folder}
                isLast={idx === filtered.length - 1}
                onClick={() => handleRowClick(folder.id)}
                onStatusChange={handleStatusChange}
              />
            ))
          })()}
        </div>
      </div>

      {foldersQuery.data && (
        <p style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>
          Showing {filtered.length} of {foldersQuery.data.total} job folders
        </p>
      )}
    </div>
  )
}
