using System.Net;

namespace ATStool.Services
{
    /// <summary>
    /// Free hosting puts the AI service to sleep after ~15 idle minutes; waking it takes ~30 s,
    /// and while it boots the platform answers 502/503/504. Retry those (and refused connections)
    /// for up to ~75 s instead of failing the user's request. Other errors are returned at once.
    /// </summary>
    public class AiWakeRetryHandler : DelegatingHandler
    {
        private static readonly TimeSpan Delay = TimeSpan.FromSeconds(5);
        private static readonly TimeSpan Budget = TimeSpan.FromSeconds(75);
        private readonly ILogger<AiWakeRetryHandler> _logger;

        public AiWakeRetryHandler(ILogger<AiWakeRetryHandler> logger)
        {
            _logger = logger;
        }

        private static bool IsWaking(HttpStatusCode code) =>
            code is HttpStatusCode.BadGateway or HttpStatusCode.ServiceUnavailable or HttpStatusCode.GatewayTimeout;

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            // Buffer the body (JSON or multipart resumes) so the same request can be sent again.
            if (request.Content != null)
                await request.Content.LoadIntoBufferAsync(cancellationToken);

            var deadline = DateTime.UtcNow + Budget;
            var attempt = 1;
            while (true)
            {
                try
                {
                    var response = await base.SendAsync(request, cancellationToken);
                    if (!IsWaking(response.StatusCode) || DateTime.UtcNow + Delay > deadline)
                        return response;

                    _logger.LogInformation("AI service returned {Status} (likely waking up); retry {Attempt} in {Delay}s",
                        (int)response.StatusCode, attempt, Delay.TotalSeconds);
                    response.Dispose();
                }
                catch (HttpRequestException ex) when (DateTime.UtcNow + Delay <= deadline)
                {
                    _logger.LogInformation("AI service unreachable ({Message}); retry {Attempt} in {Delay}s",
                        ex.Message, attempt, Delay.TotalSeconds);
                }

                await Task.Delay(Delay, cancellationToken);
                attempt++;
            }
        }
    }
}
