using ATStool.DTOs;
using ATStool.Services.Interfaces;


namespace ATStool.Services
{
    public class CategorizationService : ICategorizationService
    {
        private readonly ICandidateRepository _candidateRepo;
        private readonly IApplicationRepository _applicationRepo;

        public CategorizationService(
            ICandidateRepository candidateRepo,
            IApplicationRepository applicationRepo)
        {
            _candidateRepo = candidateRepo;
            _applicationRepo = applicationRepo;
        }

        public async Task<CategorizationResultDto> CategorizeAsync(List<HashedFileDto> hashedFiles,string jobId)
        {
            var result = new CategorizationResultDto();
            var seenThisBatch = new HashSet<string>();

            foreach (var hashedFile in hashedFiles)
            {
                if (seenThisBatch.Contains(hashedFile.Hash))
                {
                    result.Duplicates.Add(hashedFile);
                    continue;
                }

                seenThisBatch.Add(hashedFile.Hash);

                // ✅ Check hash against Applications table — not Candidates
                var existingApplication = await _applicationRepo.GetByHashAsync(hashedFile.Hash);

                if (existingApplication is null)
                {
                    // Hash not found in any application → brand new file, send to AI/ML
                    result.NewFiles.Add(hashedFile);
                }
                else
                {
                    var alreadyApplied = await _applicationRepo.ExistsAsync(existingApplication.CandidateId, jobId);

                    if (!alreadyApplied)
                    {
                        // ✅ Same resume, different job → new application only, skip AI/ML
                        result.NewApplications.Add(new NewApplicationDto
                        {
                            HashedFile = hashedFile,
                            CandidateId = existingApplication.CandidateId,
                            BlobId = existingApplication.BlobId   // ← blob from this specific application
                        });
                    }
                    else
                    {
                        // Same resume, same job → duplicate
                        result.Duplicates.Add(hashedFile);
                    }
                }
            }

            return result;
        }
    }
}