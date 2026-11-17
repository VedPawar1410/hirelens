using System.Security.Cryptography;
using ATStool.Services.Interfaces;
using ATStool.DTOs;

namespace ATStool.Services
{
    public class HashService : IHashService
    {
        public async  Task<List<HashedFileDto>> HashFiles(List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
                throw new ArgumentException("No resume files provided.");

            // After — project to tasks, await all concurrently
            var tasks = files.Select(async file =>
            {
                using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                var bytes = ms.ToArray();
                var hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLower();
                return new HashedFileDto { File = file, Hash = hash, Bytes = bytes };
            });

            return (await Task.WhenAll(tasks)).ToList();
        }
    }
}