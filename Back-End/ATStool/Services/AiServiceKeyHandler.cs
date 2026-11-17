namespace ATStool.Services
{
    /// <summary>
    /// Adds the shared secret (AiService:InternalKey) to every request this API sends to the
    /// Python AI service. On free hosting the AI service has a public URL, so without this
    /// anyone could use its LLM keys or send email through it. Empty key = local dev, no header.
    /// </summary>
    public class AiServiceKeyHandler : DelegatingHandler
    {
        public const string HeaderName = "X-Internal-Key";
        private readonly string? _key;

        public AiServiceKeyHandler(IConfiguration configuration)
        {
            _key = configuration["AiService:InternalKey"];
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (!string.IsNullOrEmpty(_key))
                request.Headers.TryAddWithoutValidation(HeaderName, _key);
            return base.SendAsync(request, cancellationToken);
        }
    }
}
