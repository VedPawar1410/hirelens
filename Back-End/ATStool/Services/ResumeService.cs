using System.Threading.Channels;
using ATStool.Services.Interfaces;
using ATStool.DTOs;
using ATStool.DTOs.Applications;
using ATStool.Data;
using ATStool.Queue;
using Microsoft.EntityFrameworkCore;

namespace ATStool.Services
{
    public class ResumeService : IResumeService
    {
        private readonly IHashService _hashService;
        private readonly ICategorizationService _categorizationService;
        private readonly IParsingService _parsingService;
        private readonly IBlobService _blobService;
        private readonly ICandidateRepository _candidateRepo;
        private readonly IApplicationRepository _applicationRepo;
        private readonly AppDbContext _context;
        private readonly Channel<AtsScoreJob> _scoreChannel;

        public ResumeService(
            IHashService hashService,
            ICategorizationService categorizationService,
            IParsingService parsingService,
            IBlobService blobService,
            ICandidateRepository candidateRepo,
            IApplicationRepository applicationRepo,
            AppDbContext context,
            Channel<AtsScoreJob> scoreChannel)
        {
            _hashService = hashService;
            _categorizationService = categorizationService;
            _parsingService = parsingService;
            _blobService = blobService;
            _context = context;
            _candidateRepo = candidateRepo;
            _applicationRepo = applicationRepo;
            _scoreChannel = scoreChannel;
        }

        private async Task EnqueueScoringJobAsync(
            string candidateId,
            string jobId,
            string resumeContent,
            string jdContent)
        {
            await _scoreChannel.Writer.WriteAsync(new AtsScoreJob
            {
                CandidateId = candidateId,
                JobId = jobId,
                ResumeContent = resumeContent,
                JdContent = jdContent,
                RetryCount = 0
            });
        }

        // H-6 — extracted from duplicate email/phone blocks
        private async Task<FileResultDto> HandleExistingCandidateAsync(
            string existingCandidateId,
            string jobId,
            string fileName,
            byte[] fileBytes,
            string fileHash,
            string unprocessedBlobName,
            string? candidateContent,
            string jdContent,
            MatchedJobDto jobInfo)
        {
            var alreadyApplied = await _applicationRepo.ExistsAsync(existingCandidateId, jobId);

            if (alreadyApplied)
            {
                await _blobService.DeleteUnprocessedResumeAsync(unprocessedBlobName);
                return new FileResultDto
                {
                    FileName = fileName,
                    Status = "already_applied",
                    CandidateId = existingCandidateId,
                    MatchedJob = jobInfo
                };
            }

            var blobName = $"{existingCandidateId}/{jobId}/{fileName}";
            var blobId = $"processed-resumes/{existingCandidateId}/{jobId}/{fileName}";

            await _blobService.UploadProcessedResumeAsync(blobName, fileBytes);
            await _applicationRepo.InsertAsync(existingCandidateId, jobId, blobId, fileHash, candidateContent);
            await _blobService.DeleteUnprocessedResumeAsync(unprocessedBlobName);

            if (!string.IsNullOrEmpty(candidateContent) && !string.IsNullOrEmpty(jdContent))
                await EnqueueScoringJobAsync(existingCandidateId, jobId, candidateContent, jdContent);

            return new FileResultDto
            {
                FileName = fileName,
                Status = "new_application",
                CandidateId = existingCandidateId,
                MatchedJob = jobInfo
            };
        }

        public async Task<UploadResumeResponse> ProcessUploadsAsync(UploadResumeRequest request)
        {
            var results = new List<FileResultDto>();

            // Step 0 — Check if job exists
            var job = await _context.Jobs.FindAsync(Guid.Parse(request.JobId));
            MatchedJobDto? jobInfo = null;

            if (job == null)
            {
                request.Files.ToList().ForEach(file => results.Add(new FileResultDto
                {
                    FileName = file.FileName,
                    Status = "failed",
                    CandidateId = null,
                    MatchedJob = null,
                    Error = $"Job with id {request.JobId} not found"
                }));

                return new UploadResumeResponse
                {
                    Processed = request.Files.Count,
                    Categorized = results
                };
            }

            jobInfo = new MatchedJobDto { Id = request.JobId, Title = job.JobTitle };
            var jdContent = job.RoleDescription ?? string.Empty;

            // Step 1 — Hash all files
            var hashedFiles = await _hashService.HashFiles(request.Files);

            // Step 2 — Categorize: new / new_application / duplicate
            var categorized = await _categorizationService.CategorizeAsync(hashedFiles, request.JobId);

            // Step 3 — Upload new files to unprocessed container BEFORE sending to AI/ML
            var fileDataList = new List<(HashedFileDto HashedFile, string UnprocessedBlobName, string UnprocessedBlobId, byte[] Bytes)>();

            foreach (var hashedFile in categorized.NewFiles)
            {
                var unprocessedBlobName = $"{hashedFile.Hash}/{hashedFile.File.FileName}";
                var unprocessedBlobId = $"unprocessed-resumes/{hashedFile.Hash}/{hashedFile.File.FileName}";

                var fileBytes = hashedFile.Bytes;

                await _blobService.UploadUnprocessedResumeAsync(unprocessedBlobName, fileBytes);

                fileDataList.Add((hashedFile, unprocessedBlobName, unprocessedBlobId, fileBytes));
            }

            // Step 4 — Send only new files to AI/ML API
            var parsedCandidates = await _parsingService.SendToApiAsync(categorized.NewFiles, request.JobId);

            // Step 5 — Process parsed candidates
            for (int i = 0; i < parsedCandidates.Count; i++)
            {
                var candidate = parsedCandidates[i];
                var (hashedFile, unprocessedBlobName, unprocessedBlobId, fileBytes) = fileDataList[i];

                // Parsing failed — skip DB inserts
                if (candidate.Status != "success")
                {
                    results.Add(new FileResultDto
                    {
                        FileName = hashedFile.File.FileName,
                        Status = "failed",
                        CandidateId = null,
                        MatchedJob = jobInfo,
                        Error = candidate.Error ?? "Parsing failed"
                    });
                    continue;
                }

                // Layer 2 — Email check
                var existingByEmail = await _candidateRepo.GetByEmailAsync(candidate.Email);
                if (existingByEmail != null)
                {
                    results.Add(await HandleExistingCandidateAsync(
                        existingByEmail.Value.CandidateId,
                        request.JobId,
                        hashedFile.File.FileName,
                        fileBytes,
                        hashedFile.Hash,
                        unprocessedBlobName,
                        candidate.Content,
                        jdContent,
                        jobInfo));
                    continue;
                }

                // Layer 3 — Phone check
                var existingByPhone = await _candidateRepo.GetByPhoneAsync(candidate.Phone);
                if (existingByPhone != null)
                {
                    results.Add(await HandleExistingCandidateAsync(
                        existingByPhone.Value.CandidateId,
                        request.JobId,
                        hashedFile.File.FileName,
                        fileBytes,
                        hashedFile.Hash,
                        unprocessedBlobName,
                        candidate.Content,
                        jdContent,
                        jobInfo));
                    continue;
                }

                // Layer 4 — Brand new candidate — scoped blob path includes jobId
                var processedBlobName = $"{candidate.CandidateId}/{request.JobId}/{hashedFile.File.FileName}";
                var processedBlobId = $"processed-resumes/{candidate.CandidateId}/{request.JobId}/{hashedFile.File.FileName}";

                await _blobService.UploadProcessedResumeAsync(processedBlobName, fileBytes);
                await _blobService.DeleteUnprocessedResumeAsync(unprocessedBlobName);
                await _candidateRepo.InsertAsync(candidate, hashedFile.Hash, processedBlobId);
                await _applicationRepo.InsertAsync(candidate.CandidateId, request.JobId, processedBlobId, hashedFile.Hash, candidate.Content);

                if (!string.IsNullOrEmpty(candidate.Content) && !string.IsNullOrEmpty(jdContent))
                    await EnqueueScoringJobAsync(candidate.CandidateId, request.JobId, candidate.Content, jdContent);

                results.Add(new FileResultDto
                {
                    FileName = hashedFile.File.FileName,
                    Status = "created",
                    CandidateId = candidate.CandidateId,
                    MatchedJob = jobInfo
                });
            }

            // Step 6 — New applications (existing candidate, new job) — upload new resume and insert application
            foreach (var newApp in categorized.NewApplications)
            {
                var fileBytes = newApp.HashedFile.Bytes;

                // Fetch content from existing application for this candidate
                var existingApplication = await _applicationRepo.GetByHashAsync(newApp.HashedFile.Hash);

                // Scoped blob path — candidateId/jobId/filename
                var processedBlobName = $"{newApp.CandidateId}/{request.JobId}/{newApp.HashedFile.File.FileName}";
                var processedBlobId = $"processed-resumes/{newApp.CandidateId}/{request.JobId}/{newApp.HashedFile.File.FileName}";

                await _blobService.UploadProcessedResumeAsync(processedBlobName, fileBytes);
                await _applicationRepo.InsertAsync(
                    newApp.CandidateId,
                    request.JobId,
                    processedBlobId,
                    newApp.HashedFile.Hash,
                    existingApplication?.Content    // reuse content from previous application
                );

                if (!string.IsNullOrEmpty(existingApplication?.Content) && !string.IsNullOrEmpty(jdContent))
                    await EnqueueScoringJobAsync(newApp.CandidateId, request.JobId, existingApplication.Content, jdContent);

                results.Add(new FileResultDto
                {
                    FileName = newApp.HashedFile.File.FileName,
                    Status = "new_application",
                    CandidateId = newApp.CandidateId,
                    MatchedJob = jobInfo
                });
            }

            // Step 7 — Duplicates (same resume hash, same job) — already applied
            foreach (var dup in categorized.Duplicates)
            {
                var existing = await _candidateRepo.GetByHashAsync(dup.Hash);

                results.Add(new FileResultDto
                {
                    FileName = dup.File.FileName,
                    Status = "already_applied",
                    CandidateId = existing?.CandidateId,
                    MatchedJob = jobInfo
                });
            }

            return new UploadResumeResponse
            {
                Processed = request.Files.Count,
                Categorized = results
            };
        }

        public async Task<List<ResumeDto>> GetResumesByJobAsync(string jobId)
        {
            var rows = await _context.Applications
                .Where(a => a.JobId == jobId)
                .Select(a => new ResumeDto
                {
                    Id = a.ApplicationId,
                    // BlobId format: processed-resumes/{candidateId}/{jobId}/{filename}
                    Filename = a.BlobId.Contains('/') ? a.BlobId.Substring(a.BlobId.LastIndexOf('/') + 1) : a.BlobId,
                    UploadedAt = a.AppliedAt,
                    Status = "processed",
                    MatchScore = a.ATSscore > 0 ? a.ATSscore : null,
                    CandidateId = a.CandidateId,
                    ErrorReason = null,
                })
                .ToListAsync();

            return rows;
        }
    }
}