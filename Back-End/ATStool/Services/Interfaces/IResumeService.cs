using ATStool.DTOs;

namespace ATStool.Services.Interfaces
{

    public interface IResumeService
    {
        Task<UploadResumeResponse> ProcessUploadsAsync(UploadResumeRequest request);
        Task<List<ResumeDto>> GetResumesByJobAsync(string jobId);
    }

}
