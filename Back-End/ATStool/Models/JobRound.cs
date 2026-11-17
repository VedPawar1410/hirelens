namespace ATStool.Models
{
    // Owned type — one configured interview round for a job. Persisted as JSON on the Jobs row.
    public class JobRound
    {
        public int Order { get; set; } = 1;          // 1-based position; doubles as the round number
        public string Name { get; set; } = string.Empty;  // e.g. "Tech Round 1", "Managerial", "HR"
        public string Type { get; set; } = string.Empty;  // "Technical" | "Managerial" | "HR" | "Final" | custom
    }
}
