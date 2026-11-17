using ATStool.Data;
using ATStool.Services.Interfaces;
using ATStool.Models;
using Microsoft.EntityFrameworkCore;
using ATStool.DTOs.Applications;

namespace ATStool.Services.Repositories
{
    public class ApplicationRepository : IApplicationRepository
    {
        private readonly AppDbContext _db;

        public ApplicationRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<bool> ExistsAsync(string candidateId, string jobId)
        {
            return await _db.Applications
                .AnyAsync(a => a.CandidateId == candidateId && a.JobId == jobId);
        }

        public async Task InsertAsync(string candidateId, string jobId, string blobId, string fileHash, string? content = null)
        {
            var entity = new Application
            {
                ApplicationId = Guid.NewGuid().ToString(),
                CandidateId = candidateId,
                JobId = jobId,
                BlobId = blobId,
                FileHash = fileHash,
                Status = "under_review",
                Content = content,
                AppliedAt = DateTime.UtcNow
            };

            await _db.Applications.AddAsync(entity);
            await _db.SaveChangesAsync();
        }

        public async Task<ApplicationLookupDto?> GetByHashAsync(string fileHash)
        {
            var application = await _db.Applications
                .FirstOrDefaultAsync(a => a.FileHash == fileHash);

            if (application == null) return null;

            return new ApplicationLookupDto
            {
                CandidateId = application.CandidateId,
                BlobId = application.BlobId,
                Content = application.Content    // ✅ return content
            };
        }
    }
}