namespace ATStool.Models
{
    /// <summary>
    /// A file (resume or JD PDF) stored in Postgres as bytea.
    /// Replaces Azure Blob Storage: (Container, Name) plays the role of container + blob name.
    /// </summary>
    public class StoredFile
    {
        public string Container { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public byte[] Data { get; set; } = [];
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
