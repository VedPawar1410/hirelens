import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NoteComposer } from '../NoteComposer'

vi.mock('../../../hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../../../../features/recruiter/candidates/api/candidatesApi', () => ({
  getCandidateNotes: vi.fn(),
  addCandidateNote: vi.fn(),
  deleteCandidateNote: vi.fn(),
}))

import { useAuth } from '../../../hooks/useAuth'
import { getCandidateNotes, addCandidateNote, deleteCandidateNote } from '../../../../features/recruiter/candidates/api/candidatesApi'

const CURRENT_USER = { id: 'u1', username: 'alice', role: 'recruiter' as const, name: 'Alice Smith' }

const OWN_NOTE = {
  noteId: 'n1',
  authorId: 'u1',
  authorName: 'Alice Smith',
  text: 'Alice note',
  createdAt: new Date().toISOString(),
}
const OTHER_NOTE = {
  noteId: 'n2',
  authorId: 'u2',
  authorName: 'Bob Jones',
  text: 'Bob note',
  createdAt: new Date().toISOString(),
}

function renderComposer(candidateId = 'c1') {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return render(<NoteComposer candidateId={candidateId} />, { wrapper })
}

describe('NoteComposer', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: CURRENT_USER,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(getCandidateNotes).mockResolvedValue([])
    vi.mocked(addCandidateNote).mockResolvedValue({
      noteId: 'new-1',
      authorId: 'u1',
      authorName: 'Alice Smith',
      text: 'hello',
      createdAt: new Date().toISOString(),
    })
    vi.mocked(deleteCandidateNote).mockResolvedValue(undefined)
  })

  it('shows loading indicator while fetching', () => {
    vi.mocked(getCandidateNotes).mockReturnValue(new Promise(() => {}))
    renderComposer()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows empty-state text when no notes exist', async () => {
    renderComposer()
    await waitFor(() => expect(screen.getByText(/No notes yet/)).toBeInTheDocument())
  })

  it('renders note text and author name from the feed', async () => {
    vi.mocked(getCandidateNotes).mockResolvedValue([OWN_NOTE])
    renderComposer()
    await waitFor(() => {
      expect(screen.getByText('Alice note')).toBeInTheDocument()
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
  })

  it('Post button is disabled when textarea is empty', async () => {
    renderComposer()
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())
    expect(screen.getByRole('button', { name: 'Post' })).toBeDisabled()
  })

  it('Post button is enabled after typing text', async () => {
    renderComposer()
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())
    await userEvent.type(screen.getByPlaceholderText(/Add a note/), 'hello')
    expect(screen.getByRole('button', { name: 'Post' })).not.toBeDisabled()
  })

  it('calls addCandidateNote with the note text and clears the draft on Post click', async () => {
    renderComposer()
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())
    const textarea = screen.getByPlaceholderText(/Add a note/)
    await userEvent.type(textarea, 'my note')
    await userEvent.click(screen.getByRole('button', { name: 'Post' }))
    expect(addCandidateNote).toHaveBeenCalledWith('c1', 'my note')
    expect(textarea).toHaveValue('')
  })

  it('submits on Ctrl+Enter keyboard shortcut', async () => {
    renderComposer()
    await waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())
    const textarea = screen.getByPlaceholderText(/Add a note/)
    await userEvent.type(textarea, 'keyboard note')
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
    expect(addCandidateNote).toHaveBeenCalledWith('c1', 'keyboard note')
  })

  it('shows trash button only on notes authored by the current user', async () => {
    vi.mocked(getCandidateNotes).mockResolvedValue([OWN_NOTE, OTHER_NOTE])
    renderComposer()
    await waitFor(() => expect(screen.getByText('Bob note')).toBeInTheDocument())
    expect(screen.getAllByRole('button', { name: 'Delete note' })).toHaveLength(1)
  })

  it('calls deleteCandidateNote with the correct noteId on trash click', async () => {
    vi.mocked(getCandidateNotes).mockResolvedValue([OWN_NOTE])
    renderComposer()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete note' })).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Delete note' }))
    expect(deleteCandidateNote).toHaveBeenCalledWith('c1', 'n1')
  })
})
