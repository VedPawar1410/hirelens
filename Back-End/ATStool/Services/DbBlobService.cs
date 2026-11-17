using ATStool.Data;
using ATStool.Exceptions;
using ATStool.Models;
using ATStool.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ATStool.Services
{
    /// <summary>
    /// IBlobService backed by the StoredFiles table in Postgres (replaces Azure Blob Storage).
    /// Registered as a singleton, so every call opens its own short-lived DbContext from the
    /// pooled factory - a shared DbContext is not thread-safe across parallel uploads.
    /// </summary>
    public class DbBlobService : IBlobService
    {
        private const string Drafts = "drafts";
        private const string ProcessedResumes = "processed-resumes";
        private const string UnprocessedResumes = "unprocessed-resumes";

        private readonly IDbContextFactory<AppDbContext> _contextFactory;

        public DbBlobService(IDbContextFactory<AppDbContext> contextFactory)
        {
            _contextFactory = contextFactory;
        }

        // ─── Drafts (JD PDFs) ────────────────────────────────────────

        public Task<bool> ExistsAsync(string blobName) => ExistsInAsync(Drafts, blobName);
        public Task UploadAsync(string blobName, byte[] data) => UpsertAsync(Drafts, blobName, data);
        public async Task<Stream> DownloadAsync(string blobName) =>
            new MemoryStream(await ReadAsync(Drafts, blobName, "Job description"));
        public Task DeleteIfExistsAsync(string blobName) => DeleteFromAsync(Drafts, blobName);
        public Task<byte[]> DownloadJobDescriptionAsync(string blobName) =>
            ReadAsync(Drafts, blobName, "Job description");

        // ─── Processed resumes ───────────────────────────────────────

        public Task UploadProcessedResumeAsync(string blobName, byte[] data) => UpsertAsync(ProcessedResumes, blobName, data);
        public Task<bool> ProcessedResumeExistsAsync(string blobName) => ExistsInAsync(ProcessedResumes, blobName);
        public Task DeleteProcessedResumeAsync(string blobName) => DeleteFromAsync(ProcessedResumes, blobName);
        public Task<byte[]> DownloadProcessedResumeAsync(string blobName) =>
            ReadAsync(ProcessedResumes, blobName, "Resume");

        // ─── Unprocessed resumes ─────────────────────────────────────

        public Task UploadUnprocessedResumeAsync(string blobName, byte[] data) => UpsertAsync(UnprocessedResumes, blobName, data);
        public async Task<Stream> DownloadUnprocessedResumeAsync(string blobName) =>
            new MemoryStream(await ReadAsync(UnprocessedResumes, blobName, "Resume"));
        public Task<bool> UnprocessedResumeExistsAsync(string blobName) => ExistsInAsync(UnprocessedResumes, blobName);
        public Task DeleteUnprocessedResumeAsync(string blobName) => DeleteFromAsync(UnprocessedResumes, blobName);

        // ─── Shared helpers ──────────────────────────────────────────

        private async Task UpsertAsync(string container, string name, byte[] data)
        {
            await using var db = await _contextFactory.CreateDbContextAsync();
            var file = await db.StoredFiles.FindAsync(container, name);
            if (file == null)
            {
                db.StoredFiles.Add(new StoredFile { Container = container, Name = name, Data = data });
            }
            else
            {
                file.Data = data;
                file.UpdatedAt = DateTime.UtcNow;
            }
            await db.SaveChangesAsync();
        }

        private async Task<byte[]> ReadAsync(string container, string name, string label)
        {
            await using var db = await _contextFactory.CreateDbContextAsync();
            var data = await db.StoredFiles.AsNoTracking()
                .Where(f => f.Container == container && f.Name == name)
                .Select(f => f.Data)
                .FirstOrDefaultAsync();
            return data ?? throw new NotFoundException($"{label} file not found: {name}");
        }

        private async Task<bool> ExistsInAsync(string container, string name)
        {
            await using var db = await _contextFactory.CreateDbContextAsync();
            return await db.StoredFiles.AnyAsync(f => f.Container == container && f.Name == name);
        }

        private async Task DeleteFromAsync(string container, string name)
        {
            await using var db = await _contextFactory.CreateDbContextAsync();
            await db.StoredFiles.Where(f => f.Container == container && f.Name == name).ExecuteDeleteAsync();
        }
    }
}
