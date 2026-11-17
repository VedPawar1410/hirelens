using Azure.Storage.Blobs;
using ATStool.Services.Interfaces;
using ATStool.Exceptions;  // ✅ add this
using ATStool.Options;
using Microsoft.Extensions.Options;


namespace ATStool.Services
{

    public class BlobService : IBlobService
    {
        private readonly BlobContainerClient _draftsContainer;
        private readonly BlobContainerClient _processedResumesContainer;
        private readonly BlobContainerClient _unprocessedResumesContainer;

        public BlobService(IOptions<AzureBlobOptions> options)
        {
            var opt = options.Value;
            var client = new BlobServiceClient(opt.ConnectionString);
            _draftsContainer = client.GetBlobContainerClient(opt.Containers.Drafts);
            _processedResumesContainer = client.GetBlobContainerClient(opt.Containers.ProcessedResumes);
            _unprocessedResumesContainer = client.GetBlobContainerClient(opt.Containers.UnprocessedResumes);
        }

        // ─── Drafts (existing) ───────────────────────────────────────

        public async Task<bool> ExistsAsync(string blobName)
        {
            var blob = _draftsContainer.GetBlobClient(blobName);
            return await blob.ExistsAsync();
        }

        public async Task UploadAsync(string blobName, byte[] data)
        {
            var blob = _draftsContainer.GetBlobClient(blobName);
            using var stream = new MemoryStream(data);
            await blob.UploadAsync(stream, overwrite: true);
        }

        public async Task<Stream> DownloadAsync(string blobName)
        {
            var blob = _draftsContainer.GetBlobClient(blobName);
            var response = await blob.DownloadAsync();
            return response.Value.Content;
        }

        public async Task DeleteIfExistsAsync(string blobName)
        {
            var blob = _draftsContainer.GetBlobClient(blobName);
            await blob.DeleteIfExistsAsync();
        }

        // ─── Processed Resumes ───────────────────────────────────────

        public async Task UploadProcessedResumeAsync(string blobName, byte[] data)
        {
            var blob = _processedResumesContainer.GetBlobClient(blobName);
            using var stream = new MemoryStream(data);
            await blob.UploadAsync(stream, overwrite: true);
        }


        public async Task<bool> ProcessedResumeExistsAsync(string blobName)
        {
            var blob = _processedResumesContainer.GetBlobClient(blobName);
            return await blob.ExistsAsync();
        }

        public async Task DeleteProcessedResumeAsync(string blobName)
        {
            var blob = _processedResumesContainer.GetBlobClient(blobName);
            await blob.DeleteIfExistsAsync();
        }

        // ─── Unprocessed Resumes ─────────────────────────────────────

        public async Task UploadUnprocessedResumeAsync(string blobName, byte[] data)
        {
            var blob = _unprocessedResumesContainer.GetBlobClient(blobName);
            using var stream = new MemoryStream(data);
            await blob.UploadAsync(stream, overwrite: true);
        }

        public async Task<Stream> DownloadUnprocessedResumeAsync(string blobName)
        {
            var blob = _unprocessedResumesContainer.GetBlobClient(blobName);
            var response = await blob.DownloadAsync();
            return response.Value.Content;
        }

        public async Task<bool> UnprocessedResumeExistsAsync(string blobName)
        {
            var blob = _unprocessedResumesContainer.GetBlobClient(blobName);
            return await blob.ExistsAsync();
        }

        public async Task DeleteUnprocessedResumeAsync(string blobName)
        {
            var blob = _unprocessedResumesContainer.GetBlobClient(blobName);
            await blob.DeleteIfExistsAsync();
        }

        //Downloads

        public async Task<byte[]> DownloadProcessedResumeAsync(string blobName)
        {
            var blob = _processedResumesContainer.GetBlobClient(blobName);

            if (!await blob.ExistsAsync())
                throw new NotFoundException($"Resume blob not found: {blobName}");

            var response = await blob.DownloadContentAsync();
            return response.Value.Content.ToArray();
        }

        public async Task<byte[]> DownloadJobDescriptionAsync(string blobName)
        {
            var blob = _draftsContainer.GetBlobClient(blobName);

            if (!await blob.ExistsAsync())
                throw new NotFoundException($"Job description blob not found: {blobName}");

            var response = await blob.DownloadContentAsync();
            return response.Value.Content.ToArray();
        }
    }

}