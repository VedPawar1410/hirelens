namespace ATStool.DTOs
{
    public class UploadResumeRequest
    {
        public string JobId { get; set; }
        public List<IFormFile> Files { get; set; }
    }

}


