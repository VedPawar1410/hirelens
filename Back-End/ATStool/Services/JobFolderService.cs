using ATStool.DTOs.Jobs;
using ATStool.Services.Interfaces;

namespace ATStool.Services
{
    public class JobFolderService : IJobFolderService
    {
        private readonly IDraftRepository _draftRepo;
        private readonly ICandidateRepository _candidateRepo;

        public JobFolderService(IDraftRepository draftRepo, ICandidateRepository candidateRepo)
        {
            _draftRepo = draftRepo;
            _candidateRepo = candidateRepo;
        }

        public async Task<JobFolderListResponse> GetJobsAsync(int page, int limit)
        {
            var (jobs, total) = await _draftRepo.GetFinalizedJobsAsync(page, limit);
            var jobIds = jobs.Select(j => j.Id.ToString()).ToList();

            var candidateCounts = await _candidateRepo.GetCandidateCountsByJobIdsAsync(jobIds);
            var filteredCounts = await _candidateRepo.GetFilteredCandidateCountsByJobIdsAsync(jobIds);
            var topCandidatesMap = await _candidateRepo.GetTopCandidatesByJobIdsAsync(jobIds);
            var applicationHistory = await _candidateRepo.GetApplicationHistoryByJobIdsAsync(jobIds);

            return new JobFolderListResponse
            {
                Total = total,
                Page = page,
                Limit = limit,
                Jobs = jobs.Select(j => new JobFolderResponse
                {
                    Id = j.Id.ToString(),
                    JobTitle = j.JobTitle,
                    Department = j.Department,
                    Location = j.Location,
                    CandidatesCount = candidateCounts.GetValueOrDefault(j.Id.ToString(), 0),
                    FilteredCount = filteredCounts.GetValueOrDefault(j.Id.ToString(), 0),
                    Status = string.IsNullOrEmpty(j.FolderStatus) ? "active" : j.FolderStatus,
                    CreatedAt = j.CreatedAt.ToString("o"),
                    TopCandidates = topCandidatesMap.GetValueOrDefault(j.Id.ToString(), [])
                        .Select(c => new TopCandidateDto { Name = c.Name, AvatarUrl = c.AvatarUrl })
                        .ToList(),
                    ApplicationHistory = applicationHistory.GetValueOrDefault(j.Id.ToString(), [])
                }).ToList()
            };
        }

        public async Task<bool> UpdateFolderStatusAsync(Guid id, string status)
        {
            var validStatuses = new HashSet<string> { "active", "paused", "closed" };
            if (!validStatuses.Contains(status))
                throw new ArgumentException("Invalid status");

            return await _draftRepo.UpdateFolderStatusAsync(id, status);
        }

        public async Task<JobFolderResponse?> GetJobByIdAsync(Guid id)
        {
            var job = await _draftRepo.GetFinalizedJobByIdAsync(id);
            if (job == null) return null;

            var jobIds = new List<string> { id.ToString() };
            var candidateCounts = await _candidateRepo.GetCandidateCountsByJobIdsAsync(jobIds);
            var filteredCounts = await _candidateRepo.GetFilteredCandidateCountsByJobIdsAsync(jobIds);
            var topCandidatesMap = await _candidateRepo.GetTopCandidatesByJobIdsAsync(jobIds);

            return new JobFolderResponse
            {
                Id = job.Id.ToString(),
                JobTitle = job.JobTitle,
                Department = job.Department,
                Location = job.Location,
                CandidatesCount = candidateCounts.GetValueOrDefault(id.ToString(), 0),
                FilteredCount = filteredCounts.GetValueOrDefault(id.ToString(), 0),
                Status = string.IsNullOrEmpty(job.FolderStatus) ? "active" : job.FolderStatus,
                CreatedAt = job.CreatedAt.ToString("o"),
                TopCandidates = topCandidatesMap.GetValueOrDefault(id.ToString(), [])
                    .Select(c => new TopCandidateDto { Name = c.Name, AvatarUrl = c.AvatarUrl })
                    .ToList()
            };
        }
    }
}
