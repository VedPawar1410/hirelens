namespace ATStool.Exceptions
{
    // Thrown when the Python AI service returns an error or empty response.
    // GlobalExceptionHandler maps this to HTTP 502.
    public class ExternalApiException : Exception
    {
        public ExternalApiException(string message, Exception? inner = null)
            : base(message, inner) { }
    }
}
