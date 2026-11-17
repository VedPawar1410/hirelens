namespace ATStool.DTOs
{
    public class HashedFileDto
    {
        public IFormFile File { get; set; }
        public string Hash { get; set; }
        public byte[] Bytes { get; set; }
    }

}