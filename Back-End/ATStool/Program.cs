using ATStool.Constants;
using ATStool.Data;
using ATStool.Middleware;
using ATStool.Models;
using ATStool.Options;
using ATStool.Queue;
using ATStool.Services;
using ATStool.Services.Interfaces;
using ATStool.Services.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;

var builder = WebApplication.CreateBuilder(args);

// Resume batches of 100+ files can exceed Kestrel's 30 MB default. Remove the limit
// globally; the upload endpoint further opts out via [DisableRequestSizeLimit].
builder.WebHost.ConfigureKestrel(opts => opts.Limits.MaxRequestBodySize = null);

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(opts =>
    {
        // Suppress automatic 400 response so controllers can return custom ApiResponse shape.
        opts.SuppressModelStateInvalidFilter = true;
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddPooledDbContextFactory<AppDbContext>(opts =>
    opts.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOpts => sqlOpts.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(3), errorNumbersToAdd: null)));

builder.Services.AddIdentityCore<User>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };

        // Accept token from Authorization: Bearer header (frontend) OR the ATSAuth HttpOnly cookie.
        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var cookie = context.Request.Cookies["ATSAuth"];
                if (!string.IsNullOrEmpty(cookie))
                    context.Token = cookie;
                return Task.CompletedTask;
            }
        };
    });

// ── CORS ──────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins!)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for cookies
    });
});

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJobService, JobService>();
builder.Services.AddScoped<ICandidateService, CandidateService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddSingleton<IBlobService, BlobService>();
builder.Services.AddHttpClient<IExternalApiService, ExternalApiService>();
builder.Services.AddScoped<GlobalExceptionHandler>();
builder.Services.AddScoped<IHashService, HashService>();
builder.Services.AddScoped<ICategorizationService, CategorizationService>();
builder.Services.AddScoped<ICandidateRepository, CandidateRepository>();
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
builder.Services.AddScoped<IResumeService, ResumeService>();
builder.Services.AddScoped<IDraftRepository, DraftRepository>();
builder.Services.AddScoped<IJobFolderService, JobFolderService>();
builder.Services.AddScoped<IInterviewService, InterviewService>();
builder.Services.AddScoped<ICandidateNoteService, CandidateNoteService>();

builder.Services.AddHttpClient<IInterviewEmailNotificationService, InterviewEmailNotificationService>(client =>
{
    var baseUrl = builder.Configuration["ExternalApi:ParsingUrl"]
        ?? "http://localhost:8000";
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<IParsingService, ParsingService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ExternalApi:ParsingUrl"]);
    client.Timeout = TimeSpan.FromMinutes(10);
});

// ── ATS Scoring queue — Channel + Worker + SSE ────────────────────────────────
builder.Services.AddSingleton(_ =>
    Channel.CreateUnbounded<AtsScoreJob>(new UnboundedChannelOptions
    {
        SingleReader = false,
        SingleWriter = false
    }));

builder.Services.AddSingleton<ISseService, SseService>();

builder.Services.AddHttpClient("AtsScoreClient", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ATSScoreGeneration:BaseUrl"]!);
    client.Timeout = TimeSpan.FromMinutes(10);
});

builder.Services.AddHostedService<AtsScoreWorker>();
builder.Services
    .AddOptions<AzureBlobOptions>()
    .BindConfiguration("AzureBlob")
    .ValidateDataAnnotations()
    .ValidateOnStart();

var app = builder.Build();

await SeedRoles(app);

// ── Middleware pipeline (order matters) ───────────────────────────────────────
app.UseMiddleware<GlobalExceptionHandler>(); // must be first to catch all exceptions
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// ── Role seeding ──────────────────────────────────────────────────────────────
static async Task SeedRoles(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var role in new[] { AppRoles.Admin, AppRoles.Recruitment, AppRoles.Interviewer })
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
}
