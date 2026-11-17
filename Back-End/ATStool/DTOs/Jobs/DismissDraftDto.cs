using System.ComponentModel.DataAnnotations;

namespace ATStool.DTOs.Jobs
{
    public class DismissDraftDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;
    }
}
