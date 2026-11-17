import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitInterviewFeedback } from '../../../../recruiter/candidates/api/interviewsApi'
import { FeedbackFormFields } from '../../../../../shared/components/ui/FeedbackFormFields'
import { SubmittedFeedbackView } from '../../../../../shared/components/ui/SubmittedFeedbackView'
import type { InterviewWithDetails } from '../../../../recruiter/candidates/api/interviewsApi'

export function FeedbackSection({
  interview,
  onSuccess,
}: Readonly<{
  interview: InterviewWithDetails
  onSuccess: () => void
}>) {
  const qc = useQueryClient()
  const alreadySubmitted = interview.overallRating !== null && interview.recommendation !== null
  const [rating, setRating] = useState(interview.overallRating ?? 0)
  const [notes, setNotes] = useState(interview.feedbackNotes ?? '')
  const [recommendation, setRecommendation] = useState(interview.recommendation ?? '')
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: () => submitInterviewFeedback(interview.interviewId, {
      overallRating: rating,
      recommendation: recommendation || undefined,
      feedbackNotes: notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviewer-interviews'] })
      setDone(true)
      setTimeout(onSuccess, 1400)
    },
  })

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <p className="text-[28px] m-0">✓</p>
        <p className="m-0 text-[16px] font-semibold" style={{ color: '#4ade80' }}>Feedback submitted</p>
      </div>
    )
  }

  if (alreadySubmitted) {
    return (
      <SubmittedFeedbackView
        heading="Feedback Submitted"
        rating={interview.overallRating}
        recommendation={interview.recommendation!}
        notes={interview.feedbackNotes}
      />
    )
  }

  return (
    <FeedbackFormFields
      rating={rating}
      onRatingChange={setRating}
      recommendation={recommendation}
      onRecommendationChange={setRecommendation}
      notes={notes}
      onNotesChange={setNotes}
      isPending={mutation.isPending}
      isError={mutation.isError}
      errorMessage="Failed to submit — please try again."
      onSubmit={() => mutation.mutate()}
    />
  )
}
