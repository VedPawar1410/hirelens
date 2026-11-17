using ATStool.DTOs;

namespace ATStool.Services.Interfaces
{
    public interface IHashService
    {
        Task<List<HashedFileDto>> HashFiles(List<IFormFile> files);
    }
}