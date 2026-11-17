import type { JobFolderStatus } from '../../../../shared/types/index'

export const STATUS_CONFIG: Record<JobFolderStatus, { label: string; color: string; bg: string; border: string }> = {
  active: { label: 'Active', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
  paused: { label: 'Paused', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  closed: { label: 'Closed', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' },
}

export function daysOpen(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
}
