namespace ATStool.Services.Interfaces;
public interface IBlobService
{
    // Drafts (existing)
    Task<bool> ExistsAsync(string blobName);
    Task UploadAsync(string blobName, byte[] data);
    Task<Stream> DownloadAsync(string blobName);
    Task DeleteIfExistsAsync(string blobName);

    // Processed Resumes
    Task UploadProcessedResumeAsync(string blobName, byte[] data);
    Task<bool> ProcessedResumeExistsAsync(string blobName);
    Task DeleteProcessedResumeAsync(string blobName);

    // Unprocessed Resumes
    Task UploadUnprocessedResumeAsync(string blobName, byte[] data);
    Task<Stream> DownloadUnprocessedResumeAsync(string blobName);
    Task<bool> UnprocessedResumeExistsAsync(string blobName);
    Task DeleteUnprocessedResumeAsync(string blobName);

    //DownLoads
    Task<byte[]> DownloadJobDescriptionAsync(string blobName);
    Task<byte[]> DownloadProcessedResumeAsync(string blobName);
}