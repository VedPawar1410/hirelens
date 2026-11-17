using Npgsql;

namespace ATStool.Data
{
    /// <summary>
    /// Hosts like Neon and Render show Postgres connection strings as URIs
    /// (postgresql://user:pass@host/db?sslmode=require), but Npgsql only accepts the
    /// key/value form (Host=...;Database=...). Accept both so either can be pasted.
    /// </summary>
    public static class PostgresConnectionString
    {
        public static string Normalize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return value ?? string.Empty;
            if (!value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
                !value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
                return value; // already key/value

            var uri = new Uri(value);
            var user = uri.UserInfo.Split(':', 2);
            var query = System.Web.HttpUtility.ParseQueryString(uri.Query);

            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = uri.Host,
                Port = uri.Port > 0 ? uri.Port : 5432,
                Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
                Username = Uri.UnescapeDataString(user[0]),
                Password = user.Length > 1 ? Uri.UnescapeDataString(user[1]) : null,
                SslMode = (query["sslmode"] ?? "").ToLowerInvariant() switch
                {
                    "disable" => SslMode.Disable,
                    "verify-full" => SslMode.VerifyFull,
                    "verify-ca" => SslMode.VerifyCA,
                    "require" => SslMode.Require,
                    _ => SslMode.Prefer,
                },
            };
            return builder.ConnectionString;
        }
    }
}
