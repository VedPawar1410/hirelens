using System;

namespace ATStool.Models
{
    // Owned type — records a round skipped for one candidate on one job. Persisted as JSON on the applications row.
    public class SkippedRound
    {
        public int Round { get; set; }                       // JobRound.Order that was skipped
        public string SkippedBy { get; set; } = string.Empty;
        public DateTimeOffset SkippedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
