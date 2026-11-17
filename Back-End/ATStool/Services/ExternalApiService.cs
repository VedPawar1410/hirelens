using System.Text;
using ATStool.Exceptions;
using ATStool.Services.Interfaces;

namespace ATStool.Services
{
    public class ExternalApiService : IExternalApiService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ExternalApiService> _logger;

        public ExternalApiService(HttpClient httpClient, ILogger<ExternalApiService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<TResult> PostAsync<TResult>(string url, object body)
        {
            var json = System.Text.Json.JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync(url, content);
                response.EnsureSuccessStatusCode();
                var responseString = await response.Content.ReadAsStringAsync();
                return System.Text.Json.JsonSerializer.Deserialize<TResult>(responseString)!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "External API POST to {Url} failed", url);
                throw new ExternalApiException($"External API call to {url} failed: {ex.Message}", ex);
            }
        }

        public async Task<byte[]> PostBytesAsync(string url, object body)
        {
            var json = System.Text.Json.JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync(url, content);
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadAsByteArrayAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "External API PDF POST to {Url} failed", url);
                throw new ExternalApiException($"PDF generation call to {url} failed: {ex.Message}", ex);
            }
        }
    }
}
