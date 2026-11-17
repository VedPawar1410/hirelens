using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ATStool.Models;

namespace ATStool.Data
{
    public class AppDbContext : IdentityDbContext<User>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Job> Jobs { get; set; }
        public DbSet<Candidate> Candidates { get; set; }
        public DbSet<Application> Applications { get; set; }
        public DbSet<Interview> Interviews { get; set; }
        public DbSet<CandidateNote> CandidateNotes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            base.OnModelCreating(modelBuilder);

            // Unique constraint on fileHash — one candidate per unique resume
            modelBuilder.Entity<Candidate>()
                .HasIndex(c => c.FileHash)
                .IsUnique();

            // Unique constraint on (CandidateId, JobId) — no duplicate applications
            modelBuilder.Entity<Application>()
                .HasIndex(a => new { a.CandidateId, a.JobId })
                .IsUnique();

            // Composite index on (JobId, Status) — every kanban/SSE/count query filters by JobId
            modelBuilder.Entity<Application>()
                .HasIndex(a => new { a.JobId, a.Status })
                .HasDatabaseName("IX_Applications_JobId_Status");

            // Limit Status/FolderStatus to nvarchar(50) so SQL Server can index them
            modelBuilder.Entity<Job>()
                .Property(j => j.Status)
                .HasMaxLength(50);

            modelBuilder.Entity<Job>()
                .Property(j => j.FolderStatus)
                .HasMaxLength(50);

            // Composite index on (Status, FolderStatus) — dashboard + job-folder list filter by both
            modelBuilder.Entity<Job>()
                .HasIndex(j => new { j.Status, j.FolderStatus })
                .HasDatabaseName("IX_Jobs_Status_FolderStatus");

            // Per-job interview round config and per-application skip audit — stored as JSON columns.
            modelBuilder.Entity<Job>()
                .OwnsMany(j => j.InterviewRounds, b => b.ToJson());

            modelBuilder.Entity<Application>()
                .OwnsMany(a => a.SkippedRounds, b => b.ToJson());

            // One candidate → many applications
            modelBuilder.Entity<Candidate>()
                .HasMany(c => c.Applications)
                .WithOne(a => a.Candidate)
                .HasForeignKey(a => a.CandidateId)
                .OnDelete(DeleteBehavior.Cascade);

            // Interview FK relationships — all Restrict to avoid cascade conflicts
            modelBuilder.Entity<Interview>()
                .HasOne(i => i.Candidate)
                .WithMany()
                .HasForeignKey(i => i.CandidateId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Interview>()
                .HasOne(i => i.Job)
                .WithMany()
                .HasForeignKey(i => i.JobId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Interview>()
                .HasOne(i => i.Interviewer)
                .WithMany()
                .HasForeignKey(i => i.InterviewerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Interview>()
                .HasOne(i => i.CreatedByUser)
                .WithMany()
                .HasForeignKey(i => i.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CandidateNote>()
                .HasKey(n => n.NoteId);

            modelBuilder.Entity<CandidateNote>()
                .HasIndex(n => n.CandidateId)
                .HasDatabaseName("IX_CandidateNotes_CandidateId");
        }

    }
}
