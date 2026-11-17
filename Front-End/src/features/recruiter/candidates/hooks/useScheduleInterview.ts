import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getInterviewers, INTERVIEWERS_QUERY_KEY } from '../../../../shared/api/authApi'
import { toSafeHttpUrl } from '../../../../shared/lib/urlUtils'
import { scheduleRound } from '../api/interviewsApi'
import type { Interviewer } from '../../../../shared/api/authApi'
import type { JobRound } from '../../../../shared/types'

export interface UseScheduleInterviewResult {
  ivRound: string
  setIvRound: (v: string) => void
  ivInterviewerId: string
  setIvInterviewerId: (v: string) => void
  ivScheduledAt: string
  setIvScheduledAt: (v: string) => void
  ivMode: 'online' | 'offline'
  setIvMode: (v: 'online' | 'offline') => void
  ivDuration: string
  setIvDuration: (v: string) => void
  ivLocation: string
  setIvLocation: (v: string) => void
  ivMeetingLink: string
  setIvMeetingLink: (v: string) => void
  ivError: string | null
  ivSuccess: boolean
  interviewers: Interviewer[] | undefined
  isLoadingInterviewers: boolean
  isPending: boolean
  canSubmit: boolean
  isPastDate: boolean
  submit: () => void
}

export function useScheduleInterview(
  candidateId: string,
  jobId: string | undefined,
  rounds: JobRound[],
  resumeBase64?: string | null,
  jdBase64?: string | null,
): UseScheduleInterviewResult {
  const queryClient = useQueryClient()
  const [ivRound, setIvRound] = useState('')
  const [ivInterviewerId, setIvInterviewerId] = useState('')
  const [ivScheduledAt, setIvScheduledAt] = useState('')
  const [ivMode, setIvMode] = useState<'online' | 'offline'>('online')
  const [ivDuration, setIvDuration] = useState('')
  const [ivLocation, setIvLocation] = useState('')
  const [ivMeetingLink, setIvMeetingLink] = useState('')
  const [ivError, setIvError] = useState<string | null>(null)
  const [ivSuccess, setIvSuccess] = useState(false)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (successTimerRef.current) clearTimeout(successTimerRef.current) }, [])

  const interviewersQuery = useQuery({
    queryKey: INTERVIEWERS_QUERY_KEY,
    queryFn: getInterviewers,
    staleTime: 5 * 60_000,
  })

  const mutation = useMutation({
    mutationFn: () => {
      if (!jobId) throw new Error('No jobId')
      const date = new Date(ivScheduledAt)
      if (Number.isNaN(date.getTime())) throw new Error('Invalid interview date')
      const selected = rounds.find(r => String(r.order) === ivRound)
      return scheduleRound({
        candidateId,
        jobId,
        interviewerId: ivInterviewerId,
        scheduledAt: date.toISOString(),
        interviewType: selected?.type || 'Interview',
        roundName: selected?.name || `Round ${ivRound}`,
        interviewRound: Number(ivRound),
        interviewMode: ivMode,
        durationMinutes: ivDuration ? Number(ivDuration) : undefined,
        location: ivMode === 'offline' ? ivLocation.trim() || undefined : undefined,
        meetingLink: ivMode === 'offline' ? undefined : toSafeHttpUrl(ivMeetingLink) ?? undefined,
        resumeBase64: resumeBase64 ?? '',
        jdBase64: jdBase64 ?? '',
      })
    },
    onSuccess: () => {
      setIvSuccess(true)
      setIvError(null)
      setIvRound('')
      setIvInterviewerId('')
      setIvScheduledAt('')
      setIvMode('online')
      setIvDuration('')
      setIvLocation('')
      setIvMeetingLink('')
      queryClient.invalidateQueries({ queryKey: ['interviews', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['candidate-preview', candidateId] })
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
      successTimerRef.current = setTimeout(() => setIvSuccess(false), 2500)
    },
    onError: () => setIvError('Failed to schedule interview. Please try again.'),
  })

  const scheduledInFuture = !!ivScheduledAt && new Date(ivScheduledAt) > new Date()
  const canSubmit = !!ivRound && !!ivInterviewerId && scheduledInFuture && !mutation.isPending

  function submit() {
    if (!canSubmit) return
    // Rendered as a clickable href in the interviewer portal, so only http(s) is allowed
    if (ivMode === 'online' && ivMeetingLink.trim() && !toSafeHttpUrl(ivMeetingLink)) {
      setIvError('Meeting link must be a valid http(s) URL.')
      return
    }
    setIvError(null)
    mutation.mutate()
  }

  return {
    ivRound, setIvRound,
    ivInterviewerId, setIvInterviewerId,
    ivScheduledAt, setIvScheduledAt,
    ivMode, setIvMode,
    ivDuration, setIvDuration,
    ivLocation, setIvLocation,
    ivMeetingLink, setIvMeetingLink,
    ivError,
    ivSuccess,
    interviewers: interviewersQuery.data,
    isLoadingInterviewers: interviewersQuery.isLoading,
    isPending: mutation.isPending,
    canSubmit,
    isPastDate: !!ivScheduledAt && !scheduledInFuture,
    submit,
  }
}
