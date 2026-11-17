using ATStool.DTOs.Interviews;

namespace ATStool.Services.Interfaces
{
    public interface IInterviewEmailNotificationService
    {
        Task<InterviewEmailNotificationResult> SendInterviewCreatedAsync(
            InterviewEmailNotificationPayload payload);

        Task<InterviewEmailNotificationResult> SendInterviewRescheduledAsync(
        InterviewRescheduleNotificationPayload payload);

        Task<InterviewEmailNotificationResult> SendInterviewCancelledAsync(
            InterviewCancelNotificationPayload payload);
    }
}