using ATStool.DTOs.Candidates;

namespace ATStool.Services.Interfaces
{
    public interface ICandidateNoteService
    {
        Task<List<CandidateNoteDto>> GetNotesAsync(string candidateId);
        Task<CandidateNoteDto> AddNoteAsync(string candidateId, string authorId, string authorName, string text);
        Task DeleteNoteAsync(Guid noteId, string requestingUserId);
    }
}
