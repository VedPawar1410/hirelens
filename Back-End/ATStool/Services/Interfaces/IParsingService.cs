using ATStool.DTOs;

namespace ATStool.Services.Interfaces
{
        public interface IParsingService
        {
            Task<List<ParsedCandidateDto>> SendToApiAsync(
                List<HashedFileDto> newFiles,
                string jobId
            );
        }
    
}