using ATStool.DTOs.Interviews;

namespace ATStool.Services.Interfaces
{
    public interface IInterviewService
    {
        Task<IEnumerable<InterviewResponseDto>> GetAllAsync();
        Task<InterviewResponseDto?> GetByIdAsync(string interviewId);
        Task<IEnumerable<InterviewResponseDto>> GetByCandidateIdAsync(string candidateId,string jobId);
        Task<IEnumerable<InterviewResponseDto>> GetByJobIdAsync(Guid jobId);
        Task<IEnumerable<InterviewResponseDto>> GetByInterviewerIdAsync(string interviewerId);
        Task<IEnumerable<InterviewWithDetailsResponseDto>> GetByInterviewerIdWithDetailsAsync(string interviewerId);
        Task<IEnumerable<InterviewResponseDto>> GetByStatusAsync(string status);
        Task<(InterviewResponseDto Interview, InterviewEmailNotificationResult EmailResult)> CreateAsync(CreateInterviewDto dto, string scheduledByUserId);
        Task<InterviewResponseDto?> UpdateAsync(string interviewId, UpdateInterviewDto dto);
        Task<InterviewResponseDto?> SubmitFeedbackAsync(string interviewId, SubmitFeedbackDto dto);
        Task<bool> DeleteAsync(string interviewId);
        Task<UpcomingInterviewsSummaryDto> GetUpcomingAsync(int hours);
        Task<(InterviewResponseDto? Interview, InterviewEmailNotificationResult EmailResult)> RescheduleAsync(string interviewId, RescheduleInterviewDto dto);
        Task<(bool Success, InterviewEmailNotificationResult EmailResult)> CancelAsync(string interviewId);
        Task<InterviewResponseDto?> MarkNoShowAsync(string interviewId);
        Task<List<int>> SkipRoundAsync(string candidateId, string jobId, int round, string skippedByUserId);
        Task<List<int>> UnskipRoundAsync(string candidateId, string jobId, int round);
    }
}
