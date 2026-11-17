using System.Net.Http.Json;
using System.Text.Json;
using ATStool.DTOs.Interviews;
using ATStool.Services.Interfaces;

namespace ATStool.Services
{
    public class InterviewEmailNotificationService : IInterviewEmailNotificationService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<InterviewEmailNotificationService> _logger;
        private readonly string _baseUrl;

        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public InterviewEmailNotificationService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<InterviewEmailNotificationService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            _baseUrl = configuration["ExternalApi:ParsingUrl"]?.TrimEnd('/')
                ?? throw new InvalidOperationException(
                    "ExternalApi:ParsingUrl is not configured in appsettings.json");
        }

        public async Task<InterviewEmailNotificationResult> SendInterviewCreatedAsync(
            InterviewEmailNotificationPayload payload)
        {
            return await SendAsync(
                $"{_baseUrl}/send-interview-email",
                payload,
                payload.InterviewId,
                "created");
        }

        public async Task<InterviewEmailNotificationResult> SendInterviewRescheduledAsync(
            InterviewRescheduleNotificationPayload payload)
        {
            return await SendAsync(
                $"{_baseUrl}/send-interview-email",
                payload,
                payload.InterviewId,
                "rescheduled");
        }

        public async Task<InterviewEmailNotificationResult> SendInterviewCancelledAsync(
            InterviewCancelNotificationPayload payload)
        {
            return await SendAsync(
                $"{_baseUrl}/cancel-interview",
                payload,
                payload.InterviewId,
                "cancelled");
        }

        // ── Private shared HTTP sender ──────────────────────────────────────
        private async Task<InterviewEmailNotificationResult> SendAsync(string url,object payload,
            string interviewId,
            string action)
        {
            try
            {
                _logger.LogInformation(
                    "[InterviewEmailNotification] Sending {Action} notification for InterviewId: {InterviewId}",
                    action, interviewId);

                var response = await _httpClient.PostAsJsonAsync(url, payload, _jsonOptions);
                var rawContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation(
                        "[InterviewEmailNotification] {Action} notification sent successfully for InterviewId: {InterviewId}",
                        action, interviewId);

                    return new InterviewEmailNotificationResult
                    {
                        Success = true,
                        Message = $"Interview {action} email notification sent successfully.",
                        Data = string.IsNullOrWhiteSpace(rawContent)
                            ? null
                            : JsonSerializer.Deserialize<object>(rawContent, _jsonOptions)
                    };
                }

                _logger.LogWarning(
                    "[InterviewEmailNotification] AI/ML service returned failure for InterviewId: {InterviewId}. " +
                    "Action: {Action}, StatusCode: {StatusCode}, Response: {Response}",
                    interviewId, action, (int)response.StatusCode, rawContent);

                return new InterviewEmailNotificationResult
                {
                    Success = false,
                    Message = string.IsNullOrWhiteSpace(rawContent)
                        ? $"AI/ML email service returned status {(int)response.StatusCode}."
                        : rawContent,
                    Data = null
                };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex,
                    "[InterviewEmailNotification] HTTP error for InterviewId: {InterviewId}, Action: {Action}",
                    interviewId, action);

                return new InterviewEmailNotificationResult
                {
                    Success = false,
                    Message = $"Could not reach the email service: {ex.Message}",
                    Data = null
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[InterviewEmailNotification] Unexpected error for InterviewId: {InterviewId}, Action: {Action}",
                    interviewId, action);

                return new InterviewEmailNotificationResult
                {
                    Success = false,
                    Message = $"Unexpected error while sending {action} email notification: {ex.Message}",
                    Data = null
                };
            }
        }
    }
}