import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCandidateNotes, addCandidateNote, deleteCandidateNote } from '../../../features/recruiter/candidates/api/candidatesApi'
import type { CandidateNote } from '../../types/index'
import { useAuth } from '../../hooks/useAuth'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function AuthorBubble({ name }: { readonly name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(99,102,241,0.18)', color: '#a5b4fc',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
    }}>
      {initials}
    </span>
  )
}

export function NoteComposer({ candidateId }: { readonly candidateId: string }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['candidate-notes', candidateId]

  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const notesQuery = useQuery({
    queryKey,
    queryFn: () => getCandidateNotes(candidateId),
    staleTime: 0,
    refetchInterval: 10_000,
  })

  const addMutation = useMutation({
    mutationFn: (text: string) => addCandidateNote(candidateId, text),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CandidateNote[]>(queryKey) ?? []
      const optimistic: CandidateNote = {
        noteId: `optimistic-${Date.now()}`,
        authorId: user?.id ?? '',
        authorName: user?.name ?? '',
        text,
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData<CandidateNote[]>(queryKey, [optimistic, ...previous])
      return { previous }
    },
    onError: (_err, _text, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => deleteCandidateNote(candidateId, noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CandidateNote[]>(queryKey) ?? []
      queryClient.setQueryData<CandidateNote[]>(queryKey, previous.filter(n => n.noteId !== noteId))
      return { previous }
    },
    onError: (_err, _noteId, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const notes = notesQuery.data ?? []
  const canPost = draft.trim().length > 0 && !addMutation.isPending

  function handlePost() {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    addMutation.mutate(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handlePost()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p className="text-[11px] font-semibold tracking-widest uppercase text-[#6b7280]">Notes</p>

      {/* Feed */}
      <div style={{
        maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent',
      }}>
        {notesQuery.isLoading && (
          <p className="text-[12px] text-[#6b7280]">Loading…</p>
        )}
        {!notesQuery.isLoading && notes.length === 0 && (
          <p className="text-[12px] text-[#4b5563]">No notes yet. Be the first to add one.</p>
        )}
        {notes.map(note => (
          <div key={note.noteId} style={{
            padding: '8px 10px', borderRadius: 8,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
              <AuthorBubble name={note.authorName} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', flex: 1 }}>{note.authorName}</span>
              <span style={{ fontSize: 11, color: '#4b5563' }}>{relativeTime(note.createdAt)}</span>
              {user?.id === note.authorId && (
                <button
                  onClick={() => deleteMutation.mutate(note.noteId)}
                  disabled={deleteMutation.isPending}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '1px 3px', borderRadius: 4, lineHeight: 1,
                    opacity: deleteMutation.isPending ? 0.4 : 0.5,
                    transition: 'opacity 120ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = deleteMutation.isPending ? '0.4' : '0.5' }}
                  aria-label="Delete note"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#d1d5db', lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {note.text}
            </p>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div style={{
        borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
      }}>
        <textarea
          ref={textareaRef}
          rows={2}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note… (⌘↵/Ctrl↵ to post)"
          className="w-full text-[12px] resize-none outline-none placeholder:text-[#374151] leading-relaxed bg-transparent"
          style={{ color: '#d1d5db', border: 'none', padding: '8px 10px', display: 'block' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px 6px' }}>
          <button
            onClick={handlePost}
            disabled={!canPost}
            style={{
              fontSize: 12, fontWeight: 600, cursor: canPost ? 'pointer' : 'not-allowed',
              padding: '4px 12px', borderRadius: 6,
              color: canPost ? '#6ea8fe' : '#374151',
              background: canPost ? 'rgba(29,43,164,0.15)' : 'transparent',
              border: `1px solid ${canPost ? 'rgba(110,168,254,0.2)' : 'rgba(255,255,255,0.04)'}`,
              transition: 'color 120ms, background 120ms, border-color 120ms',
            }}
          >
            {addMutation.isPending ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
