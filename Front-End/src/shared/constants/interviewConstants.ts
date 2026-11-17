import type { JobRound } from '../types'

// Round types a recruiter can pick from when configuring a job's interview process.
export const ROUND_TYPE_OPTIONS = ['Technical', 'Managerial', 'HR', 'Screening', 'Final'] as const

// Starter template seeded into the editor for a brand-new job. Fully editable.
export const DEFAULT_INTERVIEW_ROUNDS: JobRound[] = [
  { order: 1, name: 'Tech Round 1', type: 'Technical' },
  { order: 2, name: 'Tech Round 2', type: 'Technical' },
  { order: 3, name: 'Managerial Round', type: 'Managerial' },
  { order: 4, name: 'HR Round', type: 'HR' },
]
