using ATStool.DTOs;

namespace ATStool.Services.Interfaces
{
    public interface ICategorizationService
    {
        Task<CategorizationResultDto> CategorizeAsync(
            List<HashedFileDto> hashedFiles,
            string jobId
        );
    }
}