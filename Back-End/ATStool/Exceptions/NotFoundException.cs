namespace ATStool.Exceptions
{
    // Thrown when a requested resource does not exist in the database.
    // GlobalExceptionHandler maps this to HTTP 404.
    public class NotFoundException : Exception
    {
        public NotFoundException(string message) : base(message) { }
    }
}
