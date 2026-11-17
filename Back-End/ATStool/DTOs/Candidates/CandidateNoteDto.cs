namespace ATStool.DTOs.Candidates
{
    public record CandidateNoteDto(
        Guid NoteId,
        string AuthorId,
        string AuthorName,
        string Text,
        DateTime CreatedAt
    );

    public record AddNoteDto(string Text);
}
