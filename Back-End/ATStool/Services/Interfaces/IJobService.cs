using ATStool.DTOs.Jobs;
using ATStool.Models;

namespace ATStool.Services.Interfaces
{
    public interface IJobService
    {
        // List — filters in memory for assignedTo (JSON array column).
        Task<List<Job>> GetDraftsAsync(string? createdBy, string? assignedTo);

        // Throws NotFoundException if id does not exist.
        Task<Job> GetDraftByIdAsync(Guid id);

        // Creates draft, fires AI generation, returns draft (GeneratedJd may be null if AI failed).
        Task<Job> CreateJobAsync(CreateJobDto dto, string createdByUsername);

        // Throws NotFoundException if id does not exist.
        Task<Job> UpdateJobAsync(Guid id, PatchJobDto dto);

        // Replaces the job's interview round config (renumbers Order). Throws NotFoundException if missing.
        Task<Job> UpdateInterviewRoundsAsync(Guid id, List<JobRound> rounds);

        // Sets AssignedTo list and status → "assigned". Throws NotFoundException if missing.
        Task<Job> AssignDraftAsync(Guid id, List<string> assignedTo);

        // Updates only RoleDescription. Throws NotFoundException if missing.
        Task<Job> UpdateRoleDescriptionAsync(Guid id, string roleDescription);

        // Sets status → "returned". Throws NotFoundException if missing.
        Task<Job> SubmitDraftAsync(Guid id);

        // Calls AI API, saves GeneratedJd, returns the preview string.
        // Throws NotFoundException if missing. Throws ExternalApiException if AI returns empty.
        Task<string> GeneratePreviewAsync(Guid id);

        // Applies final edits and sets status → "finalized". Throws NotFoundException if missing.
        Task<Job> FinalizeDraftAsync(Guid id, FinalizeDraftDto dto);

        // Removes username from AssignedTo; reverts to "draft" if list empties.
        // Throws NotFoundException if id missing.
        Task<Job> DismissDraftAsync(Guid id, string username);

        // Returns PDF bytes and safe filename. Throws NotFoundException if id missing.
        // Throws InvalidOperationException if RoleDescription is empty.
        Task<(byte[] Bytes, string Filename)> DownloadPdfAsync(Guid id);

        // Hard delete. Throws NotFoundException if id missing.
        Task DeleteJobAsync(Guid id);

        Task<(byte[] FileBytes, string ContentType, string FileName)> GetJobDescriptionAsync(Guid jobId);
    }
}
