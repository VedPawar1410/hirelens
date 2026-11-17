using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using ATStool.DTOs.Candidates;
using ATStool.Services.Interfaces;

namespace ATStool.Services
{
    /// <summary>
    /// Singleton service that holds all active SSE HttpResponse objects keyed by jobId.
    /// The worker calls PushCandidatesAsync to stream candidate updates to the frontend.
    /// </summary>
    public class SseService:ISseService
    {
        private readonly ConcurrentDictionary<string, List<HttpResponse>> _connections = new();

        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public void AddConnection(string jobId, HttpResponse response)
        {
            _connections.AddOrUpdate(
                jobId,
                _ => [response],
                (_, list) => { lock (list) { list.Add(response); } return list; });
        }

        public void RemoveConnection(string jobId, HttpResponse response)
        {
            if (_connections.TryGetValue(jobId, out var list))
                lock (list) { list.Remove(response); }
        }

        public async Task PushCandidatesAsync(string jobId, List<CandidateResponse> candidates)
        {
            if (!_connections.TryGetValue(jobId, out var list)) return;

            var json = JsonSerializer.Serialize(candidates, _jsonOptions);
            var line = $"data: {json}\n\n";
            var bytes = Encoding.UTF8.GetBytes(line);

            List<HttpResponse> snapshot;
            lock (list) { snapshot = [.. list]; }

            foreach (var response in snapshot)
            {
                try
                {
                    await response.Body.WriteAsync(bytes);
                    await response.Body.FlushAsync();
                }
                catch
                {
                    RemoveConnection(jobId, response);
                }
            }
        }
    }
}
