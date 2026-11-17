using System.ComponentModel.DataAnnotations;

namespace ATStool.Options
{
    public class AzureBlobOptions
    {
        [Required] public string ConnectionString { get; set; } = null!;
        [Required] public ContainerOptions Containers { get; set; } = null!;
    }


    public class ContainerOptions
    {
        [Required] public string Drafts { get; set; } = null!;
        [Required] public string ProcessedResumes { get; set; } = null!;
        [Required] public string UnprocessedResumes { get; set; } = null!;
    }
}