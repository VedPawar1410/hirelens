using Microsoft.EntityFrameworkCore;
using ATStool.Services.Interfaces;
using ATStool.Models;
using ATStool.Data;

namespace ATStool.Services.Repositories
{
    public class DraftRepository : IDraftRepository
    {
        private readonly AppDbContext _db;

        public DraftRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<(List<Job> Jobs, int Total)> GetFinalizedJobsAsync(int page, int limit)
        {
            var baseQuery = _db.Jobs.Where(j => j.Status == "finalized");

            var total = await baseQuery.CountAsync();

            var jobs = await baseQuery
                .OrderByDescending(j => j.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return (jobs, total);
        }

        public async Task<Job?> GetFinalizedJobByIdAsync(Guid id)
        {
            return await _db.Jobs
                .Where(j => j.Id == id && j.Status == "finalized")
                .FirstOrDefaultAsync();
        }

        public async Task<bool> UpdateFolderStatusAsync(Guid id, string status)
        {
            var job = await _db.Jobs
                .FirstOrDefaultAsync(j => j.Id == id && j.Status == "finalized");

            if (job == null) return false;

            job.FolderStatus = status;
            await _db.SaveChangesAsync();
            return true;
        }
    }
}