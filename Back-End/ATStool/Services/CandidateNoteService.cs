using ATStool.Data;
using ATStool.DTOs.Candidates;
using ATStool.Models;
using ATStool.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ATStool.Services
{
    public class CandidateNoteService : ICandidateNoteService
    {
        private readonly IDbContextFactory<AppDbContext> _contextFactory;

        public CandidateNoteService(IDbContextFactory<AppDbContext> contextFactory)
        {
            _contextFactory = contextFactory;
        }

        public async Task<List<CandidateNoteDto>> GetNotesAsync(string candidateId)
        {
            await using var db = await _contextFactory.CreateDbContextAsync();
            return await db.CandidateNotes
                .Where(n => n.CandidateId == candidateId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new CandidateNoteDto(n.NoteId, n.AuthorId, n.AuthorName, n.Text, n.CreatedAt))
                .ToListAsync();
        }

        public async Task<CandidateNoteDto> AddNoteAsync(string candidateId, string authorId, string authorName, string text)
        {
            await using var db = await _contextFactory.CreateDbContextAsync();
            var note = new CandidateNote
            {
                CandidateId = candidateId,
                AuthorId = authorId,
                AuthorName = authorName,
                Text = text,
            };
            db.CandidateNotes.Add(note);
            await db.SaveChangesAsync();
            return new CandidateNoteDto(note.NoteId, note.AuthorId, note.AuthorName, note.Text, note.CreatedAt);
        }

        public async Task DeleteNoteAsync(Guid noteId, string requestingUserId)
        {
            await using var db = await _contextFactory.CreateDbContextAsync();
            var note = await db.CandidateNotes.FindAsync(noteId)
                ?? throw new KeyNotFoundException($"Note {noteId} not found.");
            if (note.AuthorId != requestingUserId)
                throw new UnauthorizedAccessException("Cannot delete another user's note.");
            db.CandidateNotes.Remove(note);
            await db.SaveChangesAsync();
        }
    }
}
