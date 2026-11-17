using Microsoft.EntityFrameworkCore;
using ATStool.Data;
using ATStool.DTOs.Jobs;
using ATStool.Exceptions;
using ATStool.Models;
using ATStool.Services.Interfaces;

namespace ATStool.Services
{
    public class JobService : IJobService
    {
        private readonly AppDbContext _context;
        private readonly IExternalApiService _apiService;
        private readonly IConfiguration _config;
        private readonly ILogger<JobService> _logger;
        private readonly IBlobService _blobService;

        public JobService(
            AppDbContext context,
            IExternalApiService apiService,
            IBlobService blobService,
            IConfiguration config,
            ILogger<JobService> logger)
        {
            _context = context;
            _apiService = apiService;
            _config = config;
            _logger = logger;
            _blobService = blobService;
        }

        public async Task<List<Job>> GetDraftsAsync(string? createdBy, string? assignedTo)
        {
            var query = _context.Jobs.AsNoTracking().AsQueryable();  // H-8 fix — AsNoTracking

            if (!string.IsNullOrEmpty(createdBy))
                query = query.Where(j => j.CreatedBy == createdBy);

            // AssignedTo is a Postgres text[]; Npgsql translates Contains to `= ANY("AssignedTo")`,
            // so the filter still runs server-side without raw SQL.
            if (!string.IsNullOrEmpty(assignedTo))
                query = query.Where(j => j.AssignedTo.Contains(assignedTo));

            return await query.ToListAsync();
        } 

        public async Task<Job> GetDraftByIdAsync(Guid id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                throw new NotFoundException($"Draft {id} not found.");
            return job;
        }

        public async Task<Job> CreateJobAsync(CreateJobDto dto, string createdByUsername)
        {
            var job = new Job
            {
                JobTitle = dto.JobTitle,
                Location = dto.Location,
                ExperienceLevel = dto.ExperienceLevel,
                WorkMode = dto.WorkMode,
                WorkHours = dto.WorkHours,
                Duration = dto.Duration,
                StipendSalary = dto.StipendSalary,
                FulltimeOfferSalary = dto.FulltimeOfferSalary,
                YearsOfExperience = dto.YearsOfExperience,
                NoticePeriod = dto.NoticePeriod,
                RelevantExperience = dto.RelevantExperience,
                RoleDescription = dto.RoleDescription,
                Status = dto.AssignedTo is { Count: > 0 } ? "assigned" : "draft",
                CreatedBy = createdByUsername,
                CreatedAt = DateTime.UtcNow,
                AssignedTo = dto.AssignedTo is { Count: > 0 } ? [.. dto.AssignedTo] : []
            };

            if (dto.InterviewRounds != null)
                ApplyRounds(job, dto.InterviewRounds);

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();

            // Skip AI generation when assigning to an interviewer — the role description
            // doesn't exist yet (the interviewer fills it in). Generation runs later via
            // POST /drafts/{id}/generate once the draft is returned.
            if (job.AssignedTo.Count == 0)
            {
                try
                {
                    var aiPayload = BuildAiPayload(job);
                    var externalUrl = _config["ExternalApi:BaseUrl"]!;
                    var aiResponse = await _apiService.PostAsync<ExternalApiResponse>(externalUrl, aiPayload);
                    if (!string.IsNullOrEmpty(aiResponse.Jd))
                    {
                        job.GeneratedJd = aiResponse.Jd;
                        await _context.SaveChangesAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "AI JD generation failed for draft {JobId} — draft saved without generated JD", job.Id);
                }
            }

            return job;
        }

        public async Task<Job> UpdateJobAsync(Guid id, PatchJobDto dto)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                throw new NotFoundException($"Draft {id} not found.");

            if (dto.JobTitle != null) job.JobTitle = dto.JobTitle;
            if (dto.Location != null) job.Location = dto.Location;
            if (dto.ExperienceLevel != null) job.ExperienceLevel = dto.ExperienceLevel;
            if (dto.WorkMode != null) job.WorkMode = dto.WorkMode;
            if (dto.WorkHours != null) job.WorkHours = dto.WorkHours;
            if (dto.Duration != null) job.Duration = dto.Duration;
            if (dto.StipendSalary != null) job.StipendSalary = dto.StipendSalary;
            if (dto.FulltimeOfferSalary != null) job.FulltimeOfferSalary = dto.FulltimeOfferSalary;
            if (dto.YearsOfExperience != null) job.YearsOfExperience = dto.YearsOfExperience;
            if (dto.NoticePeriod != null) job.NoticePeriod = dto.NoticePeriod;
            if (dto.RelevantExperience != null) job.RelevantExperience = dto.RelevantExperience;
            if (dto.RoleDescription != null) job.RoleDescription = dto.RoleDescription;
            if (dto.AssignedTo != null) job.AssignedTo = dto.AssignedTo;
            if (dto.InterviewRounds != null) ApplyRounds(job, dto.InterviewRounds);
            if (dto.Status != null) job.Status = dto.Status;

            await _context.SaveChangesAsync();
            return job;
        }

        public async Task<Job> UpdateInterviewRoundsAsync(Guid id, List<JobRound> rounds)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                throw new NotFoundException($"Draft {id} not found.");

            ApplyRounds(job, rounds);
            await _context.SaveChangesAsync();
            return job;
        }

        public async Task<Job> AssignDraftAsync(Guid id, List<string> assignedTo)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                throw new NotFoundException($"Draft {id} not found.");

            // Mutate in-place so EF Core's change tracker detects the update.
            // Replacing the reference can be missed by the PrimitiveCollection value comparer.
            job.AssignedTo.Clear();
            foreach (var u in assignedTo)
                job.AssignedTo.Add(u);

            job.Status = "assigned";
            await _context.SaveChangesAsync();
            return job;
        }

        public async Task<Job> UpdateRoleDescriptionAsync(Guid id, string roleDescription)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                throw new NotFoundException($"Draft {id} not found.");

            job.RoleDescription = roleDescription;
            await _context.SaveChangesAsync();
            return job;
        }

        public async Task<Job> SubmitDraftAsync(Guid id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                throw new NotFoundException($"Draft {id} not found.");

            job.Status = "returned";
            await _context.SaveChangesAsync();
            return job;
        }

        public async Task<string> GeneratePreviewAsync(Guid id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                throw new NotFoundException($"Draft {id} not found.");

            var aiPayload = BuildAiPayload(job);
            var externalUrl = _config["ExternalApi:BaseUrl"]!;
            var aiResponse = await _apiService.PostAsync<ExternalApiResponse>(externalUrl, aiPayload);

            if (string.IsNullOrEmpty(aiResponse.Jd))
                throw new ExternalApiException("AI service returned an empty response.");

            job.GeneratedJd = aiResponse.Jd;
            await _context.SaveChangesAsync();
            return aiResponse.Jd;
        }

        public async Task<Job> FinalizeDraftAsync(Guid id, FinalizeDraftDto dto)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                throw new NotFoundException($"Draft {id} not found.");

            if (dto.JobTitle != null) job.JobTitle = dto.JobTitle;
            if (dto.Location != null) job.Location = dto.Location;
            if (dto.ExperienceLevel != null) job.ExperienceLevel = dto.ExperienceLevel;
            if (dto.WorkMode != null) job.WorkMode = dto.WorkMode;
            if (dto.WorkHours != null) job.WorkHours = dto.WorkHours;
            if (dto.Duration != null) job.Duration = dto.Duration;
            if (dto.StipendSalary != null) job.StipendSalary = dto.StipendSalary;
            if (dto.FulltimeOfferSalary != null) job.FulltimeOfferSalary = dto.FulltimeOfferSalary;
            if (dto.YearsOfExperience != null) job.YearsOfExperience = dto.YearsOfExperience;
            if (dto.NoticePeriod != null) job.NoticePeriod = dto.NoticePeriod;
            if (dto.RelevantExperience != null) job.RelevantExperience = dto.RelevantExperience;
            if (dto.AssignedTo != null) job.AssignedTo = dto.AssignedTo;
            if (dto.InterviewRounds != null) ApplyRounds(job, dto.InterviewRounds);

            // finalJD is the recruiter-edited content — becomes the canonical role_description.
            job.RoleDescription = dto.FinalJD;
            job.Status = "finalized";
            await _context.SaveChangesAsync();

            try
            {
                var blobName = $"drafts/{id}.pdf";
                var pdfPayload = new
                {
                    finalJD = job.RoleDescription,
                    job_title = job.JobTitle,
                    experience_level = job.ExperienceLevel,
                    location = job.Location,
                    work_mode = job.WorkMode,
                    work_hours = job.WorkHours,
                    duration = job.Duration,
                    stipend_salary = job.StipendSalary,
                    fulltime_offer_salary = job.FulltimeOfferSalary,
                    years_of_experience = job.YearsOfExperience
                };

                var pdfUrl = _config["ExternalApi:PdfUrl"]!;
                var bytes = await _apiService.PostBytesAsync(pdfUrl, pdfPayload);
                if (bytes?.Length > 4 && bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46)
                    await _blobService.UploadAsync(blobName, bytes);
            }
            catch
            {
                // PDF generation failure must not block finalize — candidate detail falls back to raw text
            }

            return job;
        }

        public async Task<Job> DismissDraftAsync(Guid id, string username)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                throw new NotFoundException($"Draft {id} not found.");

            // Remove in-place (case-insensitive) so the tracked list mutation is detected.
            var toRemove = job.AssignedTo
                .Where(u => string.Equals(u, username, StringComparison.OrdinalIgnoreCase))
                .ToList();
            foreach (var u in toRemove)
                job.AssignedTo.Remove(u);

            if (job.AssignedTo.Count == 0)
                job.Status = "draft";

            await _context.SaveChangesAsync();


            return job;
        }

        public async Task<(byte[] Bytes, string Filename)> DownloadPdfAsync(Guid id)
        {
            var job = await _context.Jobs.FindAsync(id);

            if (job == null)
                throw new NotFoundException($"Draft {id} not found.");

            var safeTitle = job.JobTitle.Replace(' ', '_').Replace('/', '_').Replace('\\', '_');

            if (string.IsNullOrEmpty(job.RoleDescription))
                throw new InvalidOperationException("No JD content to export. Generate or finalize the draft first.");

            var blobName = $"drafts/{id}.pdf";
            if(await _blobService.ExistsAsync(blobName))
            {
                var existingStream = await _blobService.DownloadAsync(blobName);
                using var ms = new MemoryStream();
                await existingStream.CopyToAsync(ms);
                return (ms.ToArray(), $"JD_{safeTitle}.pdf");
            }

            var pdfPayload = new
            {
                finalJD = job.RoleDescription,
                job_title = job.JobTitle,
                experience_level = job.ExperienceLevel,
                location = job.Location,
                work_mode = job.WorkMode,
                work_hours = job.WorkHours,
                duration = job.Duration,
                stipend_salary = job.StipendSalary,
                fulltime_offer_salary = job.FulltimeOfferSalary,
                years_of_experience = job.YearsOfExperience,
                notice_period = job.NoticePeriod,
                relevant_experience = job.RelevantExperience
            };

            var pdfUrl = _config["ExternalApi:PdfUrl"]!;
            var bytes = await _apiService.PostBytesAsync(pdfUrl, pdfPayload);

            if (bytes?.Length <= 4 || bytes[0] != 0x25 || bytes[1] != 0x50 || bytes[2] != 0x44 || bytes[3] != 0x46)
                throw new InvalidOperationException("PDF generation returned invalid content.");

            await _blobService.UploadAsync(blobName, bytes);

            return (bytes, $"JD_{safeTitle}.pdf");
        }

        public async Task DeleteJobAsync(Guid id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                throw new NotFoundException($"Draft {id} not found.");

            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();
        }

        // Replaces a job's interview rounds in-place (owned collection) and renumbers Order to 1..N.
        // In-place mutation so EF Core's change tracker rewrites the JSON column reliably.
        private static void ApplyRounds(Job job, List<JobRound> rounds)
        {
            job.InterviewRounds.Clear();
            var order = 1;
            foreach (var r in rounds.OrderBy(r => r.Order))
            {
                job.InterviewRounds.Add(new JobRound
                {
                    Order = order++,
                    Name = (r.Name ?? string.Empty).Trim(),
                    Type = (r.Type ?? string.Empty).Trim()
                });
            }
        }

        // Builds the payload sent to the Python AI service.
        // Salary routing: intern → stipend + fullTimeOfferSalary (conversion), experienced → salary, fresher → fullTimeOfferSalary.
        private static object BuildAiPayload(Job job) => new
        {
            jobTitle = job.JobTitle,
            experienceLevel = job.ExperienceLevel,
            location = job.Location,
            workMode = job.WorkMode,
            workHours = job.WorkHours,
            duration = job.Duration,
            stipend = job.ExperienceLevel == "intern" ? job.StipendSalary : null,
            salary = job.ExperienceLevel == "experienced" ? job.FulltimeOfferSalary : null,
            fullTimeOfferSalary = (job.ExperienceLevel == "fresher" || job.ExperienceLevel == "intern") ? job.FulltimeOfferSalary : null,
            experienceYears = job.YearsOfExperience,
            roleDescription = job.RoleDescription,
            companyName = "Acme Corp"
        };


        public async Task<(byte[] FileBytes, string ContentType, string FileName)> GetJobDescriptionAsync(Guid jobId)
        {
            var job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == jobId)
                ?? throw new NotFoundException($"Job {jobId} not found.");

            // ✅ JD blob path is always drafts/{jobId}.pdf — derived from jobId, not stored in DB
            var blobName = $"drafts/{jobId}.pdf";
            var fileName = $"{job.JobTitle}.pdf";

            var fileBytes = await _blobService.DownloadJobDescriptionAsync(blobName);
            return (fileBytes, "application/pdf", fileName);
        }
    }
}
