using System.Text.Json;
using ATStool.Exceptions;
using ATStool.Services.Interfaces;
using ATStool.DTOs;

namespace ATStool.Services
{
    public class ParsingService : IParsingService
    {
        private readonly HttpClient _httpClient;

        public ParsingService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<List<ParsedCandidateDto>> SendToApiAsync(
            List<HashedFileDto> newFiles,
            string jobId)
        {
            if (newFiles.Count == 0) return new List<ParsedCandidateDto>();

            using var form = new MultipartFormDataContent();
            form.Add(new StringContent(jobId), "jobId");

            foreach (var hf in newFiles)
            {
                form.Add(
                    new ByteArrayContent(hf.Bytes),
                    "files",
                    hf.File.FileName
                );
            }

            var response = await _httpClient.PostAsync("/extract-resumes", form);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var candidates = JsonSerializer.Deserialize<List<ParsedCandidateDto>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                ?? throw new ExternalApiException("AI/ML API returned null response.");

            if (candidates.Count != newFiles.Count)
                throw new ExternalApiException($"AI/ML mismatch: sent {newFiles.Count}, got {candidates.Count}");

            return candidates;
        }
    }
}