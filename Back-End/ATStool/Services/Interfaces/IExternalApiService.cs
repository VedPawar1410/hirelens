namespace ATStool.Services.Interfaces
{
    public interface IExternalApiService
    {
        Task<TResult> PostAsync<TResult>(string url, object body);
        Task<byte[]> PostBytesAsync(string url, object body);
    }
}
