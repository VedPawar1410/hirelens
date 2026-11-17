import { useState, useCallback } from 'react'
import type { InterviewWithDetails } from '../../../recruiter/candidates/api/interviewsApi'

export function useInterviewDetailModal(onFeedbackComplete?: () => void) {
  const [selectedInterview, setSelectedInterview] = useState<InterviewWithDetails | null>(null)
  const [feedbackKey, setFeedbackKey] = useState(0)

  const openInterview = useCallback((iv: InterviewWithDetails) => setSelectedInterview(iv), [])
  const closeInterview = useCallback(() => setSelectedInterview(null), [])

  const handleFeedbackSuccess = useCallback(() => {
    setFeedbackKey(k => k + 1)
    setSelectedInterview(null)
    onFeedbackComplete?.()
  }, [onFeedbackComplete])

  return { selectedInterview, feedbackKey, openInterview, closeInterview, handleFeedbackSuccess }
}
