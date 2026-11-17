using System.ComponentModel.DataAnnotations;

namespace ATStool.DTOs.Jobs
{
    public class AssignDraftDto
    {
        [Required]
        public List<string> AssignedTo { get; set; } = [];
    }
}
