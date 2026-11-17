import { useState } from 'react'
import type { ReactNode } from 'react'
import { Briefcase } from 'lucide-react'
import { Sparkline } from '../../../../../shared/components/ui/Sparkline'
import { AvatarStack } from './AvatarStack'
import { StatusDropdown } from './StatusDropdown'
import { daysOpen } from '../../utils/jobsUtils'
import type { JobFolder, JobFolderStatus } from '../../../../../shared/types/index'

const COL_WIDTHS = '2fr 1.5fr 1fr 1fr 0.85fr'

function JobRowShell({ jobTitle, isLast, onClick, children }: Readonly<{
  jobTitle: string
  isLast: boolean
  onClick: () => void
  children: ReactNode
}>) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        position: 'relative',
        borderBottom: isLast ? 'none' : '1px solid #1e2028',
        background: hovered ? 'rgba(255,255,255,0.022)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open ${jobTitle}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'absolute', inset: 0,
          background: 'transparent', border: 'none',
          cursor: 'pointer', width: '100%', height: '100%',
        }}
      />
      {children}
    </div>
  )
}

function JobMetaRow({ department, location, ageColor, days, marginTop }: Readonly<{
  department?: string
  location?: string
  ageColor: string
  days: number
  marginTop: number
}>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop, flexWrap: 'wrap' }}>
      {department && <span style={{ fontSize: 11, color: '#9ca3af' }}>{department}</span>}
      {department && location && <span style={{ fontSize: 11, color: '#374151' }}>·</span>}
      {location && <span style={{ fontSize: 11, color: '#9ca3af' }}>{location}</span>}
      <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 999, color: ageColor, background: `${ageColor}18`, border: `1px solid ${ageColor}28` }}>
        {days}d open
      </span>
    </div>
  )
}

function getAgeColor(days: number): string {
  if (days > 60) return '#ef4444'
  if (days > 30) return '#f59e0b'
  return '#6b7280'
}

export function TableHeader() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: COL_WIDTHS,
      padding: '10px 24px', gap: 16, borderBottom: '1px solid #1e2028',
      fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: '#4b5563',
    }}>
      <span>Role</span>
      <span>Pipeline</span>
      <span>Fill Rate</span>
      <span>Top Candidates</span>
      <span>Status</span>
    </div>
  )
}

function FillBar({ filled, total }: Readonly<{ filled: number; total: number }>) {
  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: 11, color: '#6b7280' }}>of {total}</span>
      </div>
      <div style={{ width: '100%', height: 4, borderRadius: 999, background: '#2a2d35', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 999,
          background: 'linear-gradient(90deg,#6366f1,#818cf8)',
          transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}

export function JobTableRow({
  folder, isLast, onClick, onStatusChange,
}: Readonly<{
  folder: JobFolder
  isLast: boolean
  onClick: () => void
  onStatusChange: (id: string, status: JobFolderStatus) => void
}>) {
  const days = daysOpen(folder.createdAt)
  const ageColor = getAgeColor(days)

  return (
    <JobRowShell jobTitle={folder.jobTitle} isLast={isLast} onClick={onClick}>
      <div style={{
        display: 'grid', gridTemplateColumns: COL_WIDTHS,
        padding: '14px 24px', gap: 16, alignItems: 'center',
        position: 'relative', width: '100%', textAlign: 'left',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'rgba(29,43,164,0.15)', border: '1px solid rgba(29,43,164,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Briefcase size={15} style={{ color: '#6ea8fe' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {folder.jobTitle}
            </p>
            <JobMetaRow department={folder.department} location={folder.location} ageColor={ageColor} days={days} marginTop={4} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{folder.candidatesCount}</span>
            <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applied</span>
          </div>
          <Sparkline data={folder.applicationHistory} />
        </div>

        <FillBar filled={folder.filteredCount} total={folder.candidatesCount} />
        <AvatarStack candidates={folder.topCandidates} />

        <div style={{ pointerEvents: 'auto' }}>
          <StatusDropdown folder={folder} onStatusChange={onStatusChange} />
        </div>
      </div>
    </JobRowShell>
  )
}

export function MobileJobRow({
  folder, isLast, onClick, onStatusChange,
}: Readonly<{
  folder: JobFolder
  isLast: boolean
  onClick: () => void
  onStatusChange: (id: string, status: JobFolderStatus) => void
}>) {
  const days = daysOpen(folder.createdAt)
  const ageColor = getAgeColor(days)

  return (
    <JobRowShell jobTitle={folder.jobTitle} isLast={isLast} onClick={onClick}>
      <div style={{
        padding: '14px 16px',
        position: 'relative', width: '100%', textAlign: 'left',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'rgba(29,43,164,0.15)', border: '1px solid rgba(29,43,164,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
          }}>
            <Briefcase size={14} style={{ color: '#6ea8fe' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {folder.jobTitle}
              </p>
              <div style={{ pointerEvents: 'auto' }}>
                <StatusDropdown folder={folder} onStatusChange={onStatusChange} />
              </div>
            </div>
            <JobMetaRow department={folder.department} location={folder.location} ageColor={ageColor} days={days} marginTop={3} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{folder.candidatesCount}</p>
                <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginTop: 2 }}>Applied</p>
              </div>
              <div style={{ width: 1, height: 28, background: '#1e2028' }} />
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#818cf8', margin: 0, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{folder.filteredCount}</p>
                <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginTop: 2 }}>Filtered</p>
              </div>
              {folder.topCandidates.length > 0 && <AvatarStack candidates={folder.topCandidates} />}
            </div>
          </div>
        </div>
      </div>
    </JobRowShell>
  )
}
