using System.ComponentModel.DataAnnotations;

namespace ATStool.DTOs.Jobs
{
    public class RoleDescriptionDto
    {
        [Required]
        public string RoleDescription { get; set; } = string.Empty;
    }
}
