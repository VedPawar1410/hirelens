import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackFormFields } from '../FeedbackFormFields'

function defaults(overrides = {}) {
  return {
    rating: 0,
    onRatingChange: vi.fn(),
    recommendation: '',
    onRecommendationChange: vi.fn(),
    notes: '',
    onNotesChange: vi.fn(),
    isPending: false,
    isError: false,
    onSubmit: vi.fn(),
    ...overrides,
  }
}

describe('FeedbackFormFields', () => {
  it('renders rating buttons 1–5', () => {
    render(<FeedbackFormFields {...defaults()} />)
    for (let n = 1; n <= 5; n++) {
      expect(screen.getByRole('button', { name: String(n) })).toBeInTheDocument()
    }
  })

  it('fires onRatingChange when a rating button is clicked', async () => {
    const onRatingChange = vi.fn()
    render(<FeedbackFormFields {...defaults({ onRatingChange })} />)
    await userEvent.click(screen.getByRole('button', { name: '4' }))
    expect(onRatingChange).toHaveBeenCalledWith(4)
  })

  it('shows the score readout when rating > 0', () => {
    render(<FeedbackFormFields {...defaults({ rating: 3 })} />)
    // "/5" is unique to the score readout — finds the parent span containing "3"
    expect(screen.getByText('/5')).toBeInTheDocument()
  })

  it('fires onRecommendationChange on selection', async () => {
    const onRecommendationChange = vi.fn()
    render(<FeedbackFormFields {...defaults({ onRecommendationChange })} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'Hire')
    expect(onRecommendationChange).toHaveBeenCalledWith('Hire')
  })

  it('fires onNotesChange as user types', async () => {
    const onNotesChange = vi.fn()
    render(<FeedbackFormFields {...defaults({ onNotesChange })} />)
    await userEvent.type(screen.getByPlaceholderText('Add interview notes…'), 'abc')
    expect(onNotesChange).toHaveBeenCalled()
  })

  it('renders the error message when isError', () => {
    render(<FeedbackFormFields {...defaults({ isError: true, errorMessage: 'Boom' })} />)
    expect(screen.getByText('Boom')).toBeInTheDocument()
  })

  it('uses default error message when none provided', () => {
    render(<FeedbackFormFields {...defaults({ isError: true })} />)
    expect(screen.getByText(/Failed to submit feedback/)).toBeInTheDocument()
  })

  it('disables submit button when form is incomplete', () => {
    render(<FeedbackFormFields {...defaults()} />)
    expect(screen.getByRole('button', { name: 'Submit Feedback' })).toBeDisabled()
  })

  it('enables submit when all fields filled', () => {
    render(<FeedbackFormFields {...defaults({
      rating: 4,
      recommendation: 'Hire',
      notes: 'good',
    })} />)
    expect(screen.getByRole('button', { name: 'Submit Feedback' })).toBeEnabled()
  })

  it('calls onSubmit when submit button is clicked', async () => {
    const onSubmit = vi.fn()
    render(<FeedbackFormFields {...defaults({
      rating: 4, recommendation: 'Hire', notes: 'good', onSubmit,
    })} />)
    await userEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('renders "Submitting…" when isPending', () => {
    render(<FeedbackFormFields {...defaults({ isPending: true })} />)
    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled()
  })
})
