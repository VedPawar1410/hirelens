using ATStool.Data;
using ATStool.DTOs;
using ATStool.Services.Interfaces;
using ATStool.Models;
using Microsoft.EntityFrameworkCore;

namespace ATStool.Services.Repositories
{
    public class CandidateRepository : ICandidateRepository
    {
        private readonly AppDbContext _db;

        public CandidateRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<(string CandidateId, string BlobId)?> GetByHashAsync(string fileHash)
        {
            var candidate = await _db.Candidates
                .Where(c => c.FileHash == fileHash)
                .Select(c => new { c.CandidateId, c.BlobId })
                .FirstOrDefaultAsync();

            return candidate is null ? null : (candidate.CandidateId, candidate.BlobId);
        }

        public async Task InsertAsync(ParsedCandidateDto candidate, string fileHash, string blobId)
        {
            var entity = new Candidate
            {
                CandidateId = candidate.CandidateId,
                Name = candidate.Name,
                Email = candidate.Email,
                Phone = candidate.Phone,
                LinkedIn = candidate.LinkedIn,
                GitHub = candidate.GitHub,
                Content = candidate.Content,
                FileHash = fileHash,
                BlobId = blobId,
                AvatarUrl = GenerateAvatarUrl(candidate.Name),
            };

            await _db.Candidates.AddAsync(entity);
            await _db.SaveChangesAsync();
        }

        // Returns candidates for ONE specific job
        public async Task<List<Candidate>> GetCandidatesByJobIdAsync(string jobId)
        {
            var candidateIds = await _db.Applications
                .Where(a => a.JobId == jobId)           // single jobId
                .Select(a => a.CandidateId)
                .ToListAsync();

            return await _db.Candidates
                .Where(c => candidateIds.Contains(c.CandidateId))
                .ToListAsync();
        }

        public async Task<Dictionary<string, int>> GetCandidateCountsByJobIdsAsync(List<string> jobIds)
        {
            return await _db.Applications
                .Where(a => jobIds.Contains(a.JobId))
                .GroupBy(a => a.JobId)
                .Select(g => new { JobId = g.Key, Count = g.Select(a => a.CandidateId).Distinct().Count() })
                .ToDictionaryAsync(x => x.JobId, x => x.Count);
        }

        // ✅ New — multiple jobIds, returns filtered count per jobId
        public async Task<Dictionary<string, int>> GetFilteredCandidateCountsByJobIdsAsync(List<string> jobIds)
        {
            return await _db.Applications
                .Where(a => jobIds.Contains(a.JobId))
                .Join(_db.Candidates,
                    a => a.CandidateId,
                    c => c.CandidateId,
                    (a, c) => new { a.JobId, a.Status })
                .Where(x => x.Status == "filtered")
                .GroupBy(x => x.JobId)
                .Select(g => new { JobId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.JobId, x => x.Count);
        }

        public async Task<Dictionary<string, List<(string Name, string? AvatarUrl)>>> GetTopCandidatesByJobIdsAsync(List<string> jobIds, int top = 3)
        {
            // Fetch all rows for the job IDs — EF Core can translate this part
            var rows = await _db.Applications
                .Where(a => jobIds.Contains(a.JobId))
                .Join(_db.Candidates,
                    a => a.CandidateId,
                    c => c.CandidateId,
                    (a, c) => new { a.JobId, a.CandidateId, c.Name, c.AvatarUrl, a.ATSscore })
                .ToListAsync();

            // Per-group Take done in memory — EF Core can't translate DistinctBy inside SelectMany
            return rows
                .GroupBy(x => x.JobId)
                .ToDictionary(
                    g => g.Key,
                    g => g.DistinctBy(x => x.CandidateId)
                           .OrderByDescending(x => x.ATSscore)
                           .Take(top)
                           .Select(x => (x.Name ?? "", x.AvatarUrl))
                           .ToList()
                );
        }

        public async Task<Dictionary<string, List<int>>> GetApplicationHistoryByJobIdsAsync(List<string> jobIds, int days = 8)
        {
            var cutoff = DateTime.UtcNow.Date.AddDays(-(days - 1));

            var rows = await _db.Applications
                .Where(a => jobIds.Contains(a.JobId) && a.AppliedAt >= cutoff)
                .Select(a => new { a.JobId, Date = a.AppliedAt.Date })
                .ToListAsync();

            var result = new Dictionary<string, List<int>>();
            foreach (var jobId in jobIds)
            {
                var counts = new int[days];
                foreach (var row in rows.Where(r => r.JobId == jobId))
                {
                    int idx = (int)(row.Date - cutoff).TotalDays;
                    if (idx >= 0 && idx < days) counts[idx]++;
                }
                result[jobId] = [.. counts];
            }
            return result;
        }

        public async Task<(string CandidateId, string BlobId)?> GetByEmailAsync(string? email)
        {
            if (string.IsNullOrEmpty(email)) return null;
            var candidate = await _db.Candidates.Where(a => a.Email == email).FirstOrDefaultAsync();
            return candidate is null ? null : (candidate.CandidateId, candidate.BlobId);
        }


        public async Task<(string CandidateId, string BlobId)?> GetByPhoneAsync(string phone)
        {
            var candidate = await _db.Candidates.Where(c => c.Phone == phone && c.Phone != null).FirstOrDefaultAsync();

            return candidate is null ? null : (candidate.CandidateId, candidate.BlobId);
        }

        private string GenerateAvatarUrl(string? name)
        {
            var colors = new[] { "1a73e8", "6d28d9", "0f766e", "b45309", "dc2626", "475569", "065f46", "9d174d" };

            var randomColor = colors[Random.Shared.Next(colors.Length)];

            return !string.IsNullOrEmpty(name)
                ? $"https://api.dicebear.com/7.x/initials/svg?seed={Uri.EscapeDataString(name)}&backgroundColor={randomColor}&backgroundType=circle"
                : $"https://api.dicebear.com/7.x/initials/svg?seed=?&backgroundColor={randomColor}&backgroundType=circle";
        }
    }
}