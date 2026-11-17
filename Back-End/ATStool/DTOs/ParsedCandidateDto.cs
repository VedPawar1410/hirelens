
    namespace ATStool.DTOs
    {
        public class ParsedCandidateDto
        {
            public int Index { get; set; }
            public string CandidateId { get; set; } = string.Empty;
            public string Status { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string? LinkedIn { get; set; }
            public string? GitHub { get; set; }
            public string? Content { get; set; }
            public string? Error { get; set; }
            public string? JobId { get; set; }
        }
    }


