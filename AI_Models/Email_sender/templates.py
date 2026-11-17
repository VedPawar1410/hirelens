"""Email templates for different interview rounds"""


class EmailTemplates:
    """Email templates for each interview round"""

    @staticmethod
    def get_candidate_template(round: str) -> tuple:
        """
        Get email subject and body template for candidate.
        Returns: (subject_template, body_template)
        """

        if round.upper() == "L1":
            subject = "Interview Scheduled | L1 Technical Round | ${jobTitle} | ${candidateName}"

            body = """
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <p>Dear ${candidateName},</p>

    <p>Thank you for showing interest in the above-mentioned role. We (Acme Corp) would like to invite you to an online interview. In this round, you will meet with a panel member to discuss your knowledge, interests, and previous projects.</p>

    <h3>Interview Details:</h3>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Round</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">L1 - Technical Round</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Job Title</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobTitle}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Date &amp; Time</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${startTime} &ndash; ${endTime}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Duration</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${durationMinutes} minutes</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Mode</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${interviewMode}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Meeting Link</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="${meetingLink}">${meetingLink}</a></td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Location</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${location}</td>
        </tr>
        <tr>
            <td style="padding: 8px; font-weight: bold;">Interviewer</td>
            <td style="padding: 8px;">${interviewerName}</td>
        </tr>
        ${additionalInstructionsBlock}
    </table>

    <p style="margin-top: 20px;">Feel free to reach out to me if you have any concerns.</p>

    <p>Best Regards,<br>
    HR Team<br>
    Acme Corp<br>
    hr@example.com</p>
</body>
</html>
            """

        elif round.upper() == "L2":
            subject = "Interview Scheduled | L2 Technical Round | ${jobTitle} | ${candidateName}"

            body = """
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <p>Dear ${candidateName},</p>

    <p>Congratulations on successfully clearing the L1 round. We (Acme Corp) would like to invite you to the next stage of the interview process.</p>

    <h3>Interview Details:</h3>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Round</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">L2 - Technical Round</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Job Title</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobTitle}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Date &amp; Time</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${startTime} &ndash; ${endTime}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Duration</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${durationMinutes} minutes</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Mode</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${interviewMode}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Meeting Link</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="${meetingLink}">${meetingLink}</a></td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Location</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${location}</td>
        </tr>
        <tr>
            <td style="padding: 8px; font-weight: bold;">Interviewer</td>
            <td style="padding: 8px;">${interviewerName}</td>
        </tr>
        ${additionalInstructionsBlock}
    </table>

    <p style="margin-top: 20px;">Feel free to reach out to me if you have any concerns.</p>

    <p>Best Regards,<br>
    HR Team<br>
    Acme Corp<br>
    hr@example.com</p>
</body>
</html>
            """

        elif round.upper() == "L3":
            subject = "Interview Scheduled | L3 Round | ${jobTitle} | ${candidateName}"

            body = """
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <p>Dear ${candidateName},</p>

    <p>Congratulations! Thank you for your time and effort so far in the interview process. We are happy to move you to the L3 Round at Acme Corp.</p>

    <h3>Interview Details:</h3>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Round</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">L3 Round</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Job Title</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobTitle}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Date &amp; Time</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${startTime} &ndash; ${endTime}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Duration</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${durationMinutes} minutes</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Mode</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${interviewMode}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Meeting Link</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="${meetingLink}">${meetingLink}</a></td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Location</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${location}</td>
        </tr>
        <tr>
            <td style="padding: 8px; font-weight: bold;">Interviewer</td>
            <td style="padding: 8px;">${interviewerName}</td>
        </tr>
        ${additionalInstructionsBlock}
    </table>

    <p style="margin-top: 20px;">Feel free to reach out to me if you have any concerns.</p>

    <p>Best Regards,<br>
    HR Team<br>
    Acme Corp<br>
    hr@example.com</p>
</body>
</html>
            """

        elif round.upper() == "L4":
            subject = "Interview Scheduled | L4 Round | ${jobTitle} | ${candidateName}"

            body = """
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <p>Dear ${candidateName},</p>

    <p>Congratulations! You have cleared all the previous rounds and we at Acme Corp would like to invite you for the Final Round of the interview process.</p>

    <h3>Interview Details:</h3>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Round</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">L4 Round</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Job Title</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobTitle}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Date &amp; Time</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${startTime} &ndash; ${endTime}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Duration</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${durationMinutes} minutes</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Mode</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${interviewMode}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Meeting Link</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="${meetingLink}">${meetingLink}</a></td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Location</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${location}</td>
        </tr>
        <tr>
            <td style="padding: 8px; font-weight: bold;">Interviewer</td>
            <td style="padding: 8px;">${interviewerName}</td>
        </tr>
        ${additionalInstructionsBlock}
    </table>

    <p style="margin-top: 20px;">Best Regards,<br>
    HR Team<br>
    Acme Corp<br>
    hr@example.com</p>
</body>
</html>
            """

        else:
            raise ValueError(f"Unknown interview round: {round}")

        return subject, body

    @staticmethod
    def get_interviewer_template() -> tuple:
        """
        Get email template for interviewer (simple notification).
        Returns: (subject_template, body_template)
        """

        subject = "Interview Scheduled | ${jobTitle} | ${candidateName} | ${interviewRound}"

        body = """
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <p>Hi ${interviewerName},</p>

    <p>This is to confirm that an interview has been scheduled. Please find the details below:</p>

    <h3>Interview Details:</h3>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Candidate Name</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${candidateName}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Candidate Email</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="mailto:${candidateEmail}">${candidateEmail}</a></td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Job Title</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${jobTitle}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Round</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${interviewRound}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Type</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${interviewType}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Date &amp; Time</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${startTime} &ndash; ${endTime}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Duration</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${durationMinutes} minutes</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Mode</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${interviewMode}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Meeting Link</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="${meetingLink}">${meetingLink}</a></td>
        </tr>
        <tr>
            <td style="padding: 8px; font-weight: bold;">Location</td>
            <td style="padding: 8px;">${location}</td>
        </tr>
    </table>

    <p style="margin-top: 20px;">Resume and Job Description are attached for your reference.</p>

    <p>Best Regards,<br>
    HR Team<br>
    Acme Corp</p>
</body>
</html>
        """

        return subject, body
