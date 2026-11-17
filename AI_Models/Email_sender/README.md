# 📧 Email Sender Service

## Overview

The Email Sender service automatically sends interview notification emails to candidates and interviewers.

**Features:**
- ✅ Sends personalized emails based on interview round (L1/L2/L3/L4)
- ✅ HTML formatted professional emails
- ✅ Automatic PDF attachments (resume + JD)
- ✅ Supports any SMTP provider (Gmail, Office365, custom SMTP)
- ✅ Error handling and detailed logging
- ✅ Base64 file decoding from API requests

---

## 🚀 Quick Start

### Step 1: Configure SMTP Credentials

Add to `.env` file:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your_email@gmail.com
SENDER_PASSWORD=xxxx xxxx xxxx xxxx  # Use App Password for Gmail!
SENDER_NAME=HR Team - HireLens
```

**For Gmail:**
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Copy 16-character password to `SENDER_PASSWORD`

### Step 2: API is Ready

The endpoint is automatically available when API server starts:

```
POST http://localhost:8000/send-interview-email
```

---

## 📡 API Endpoint

### POST `/send-interview-email`

**Tags:** `Email Sender`

Send interview notification emails to candidate and interviewer.

#### Request Body

```json
{
  "interviewId": "550e8400-e29b-41d4-a716-446655440000",
  "candidateName": "John Doe",
  "candidateEmail": "john@example.com",
  "interviewerName": "Jane Smith",
  "interviewerEmail": "jane@hirelens.com",
  "jobTitle": "Senior AI Engineer",
  "companyName": "HireLens",
  "interviewRound": "L1",
  "interviewType": "Technical",
  "interviewMode": "online",
  "startTime": "2026-05-25T10:00:00+05:30",
  "endTime": "2026-05-25T11:00:00+05:30",
  "durationMinutes": 60,
  "timezone": "Asia/Kolkata",
  "meetingLink": "https://teams.microsoft.com/l/meetup-join/...",
  "location": null,
  "createdByUserName": "HR Admin",
  "createdByUserEmail": "hr@hirelens.com",
  "resumeBase64": "JVBERi0xLjQKJ...",
  "jdBase64": "JVBERi0xLjQKJ...",
  "additionalInstructions": "Please prepare coding questions"
}
```

#### Response (Success)

```json
{
  "success": true,
  "message": "Emails sent successfully.",
  "data": {
    "candidateEmailStatus": "sent",
    "interviewerEmailStatus": "sent"
  },
  "error": null
}
```

#### Response (Partial Failure)

```json
{
  "success": false,
  "message": "Some emails failed to send",
  "data": {
    "candidateEmailStatus": "sent",
    "interviewerEmailStatus": "failed"
  },
  "error": "Candidate: null, Interviewer: SMTP authentication failed..."
}
```

---

## 📋 Email Templates

### L1 Round (Candidate Email)

```
Subject: Interview Scheduled | L1 Technical Round | ${jobTitle} | ${candidateName}

Body: Welcome message + interview details table
```

### L2 Round (Candidate Email)

```
Subject: Interview Scheduled | L2 Technical Round | ${jobTitle} | ${candidateName}

Body: Congratulations on L1 + interview details table
```

### L3 Round (Candidate Email)

```
Subject: Interview Scheduled | L3 Round | ${jobTitle} | ${candidateName}

Body: Congratulations on L1 & L2 + interview details table
```

### L4 Round (Candidate Email)

```
Subject: Interview Scheduled | L4 Round | ${jobTitle} | ${candidateName}

Body: Final round + interview details table
```

### Interviewer Email (All Rounds)

```
Subject: Interview Scheduled | ${jobTitle} | ${candidateName} | ${interviewRound}

Body: Simple summary with candidate info, interview details, and attachments
```

---

## 🛠️ Architecture

### File Structure

```
Email_sender/
├── __init__.py              ← Package initialization
├── models.py                ← Pydantic request/response models
├── email_service.py         ← Main email sending logic
├── templates.py             ← Email templates (L1, L2, L3, L4)
├── smtp_config.py           ← SMTP configuration loader
└── utils.py                 ← Helper utilities (Base64 decode, templating, etc.)
```

### Data Flow

```
.NET Backend
    ↓
POST /send-interview-email
    ↓
EmailService.send_interview_emails()
    ├─ Validate email addresses
    ├─ Decode Base64 (resume + JD)
    ├─ Prepare template variables
    ├─ Send candidate email (L1/L2/L3/L4 template)
    ├─ Send interviewer email
    ├─ Cleanup temp files
    └─ Return response
    ↓
.NET Backend receives {success, data, error}
```

---

## 📦 Key Classes

### `EmailService`

Main service class for sending emails.

```python
from Email_sender.email_service import EmailService
from Email_sender.models import SendInterviewEmailRequest

# Send emails
response = EmailService.send_interview_emails(request)
```

**Methods:**
- `send_interview_emails(request)` - Send emails to both candidate and interviewer
- `_send_candidate_email(request, variables, resume_path, jd_path)` - Send to candidate
- `_send_interviewer_email(request, variables, resume_path, jd_path)` - Send to interviewer
- `_send_email(to_email, subject, body, attachments)` - Generic SMTP sender

### `EmailTemplates`

Email template provider for different interview rounds.

```python
from Email_sender.templates import EmailTemplates

# Get candidate template
subject, body = EmailTemplates.get_candidate_template("L1")

# Get interviewer template
subject, body = EmailTemplates.get_interviewer_template()
```

### `Base64FileDecoder`

Decode Base64 files to temporary PDFs.

```python
from Email_sender.utils import Base64FileDecoder

# Decode and save to temp file
temp_path = Base64FileDecoder.decode_to_temp_file(
    base64_string,
    "resume.pdf"
)

# Cleanup after use
Base64FileDecoder.cleanup_temp_file(temp_path)
```

### `TemplateVariableSubstituter`

Replace variables in email templates.

```python
from Email_sender.utils import TemplateVariableSubstituter

# Replace ${variable} with values
text = TemplateVariableSubstituter.substitute(
    "Hello ${name}",
    {"name": "John"}
)
# Result: "Hello John"
```

---

## 🔒 Security & Best Practices

- ✅ **Never commit .env file** - Already in `.gitignore`
- ✅ **Use App Passwords** - Not your regular email password
- ✅ **Temporary files cleaned up** - No residual PDFs on server
- ✅ **HTML escaping** - Prevents email injection
- ✅ **Error logging** - Detailed errors for debugging

---

## 🐛 Troubleshooting

### Issue: "SMTP authentication failed"

**Solution:**
- ✅ For Gmail: Use **App Password**, not regular password
- ✅ Verify `SENDER_EMAIL` and `SENDER_PASSWORD` are correct
- ✅ Check 2-Step Verification is enabled on Gmail account

### Issue: "Connection refused" on SMTP

**Solution:**
- ✅ Verify `SMTP_SERVER` and `SMTP_PORT` are correct
- ✅ For Gmail: Use port 587 (TLS) or 465 (SSL)
- ✅ Check firewall/network allows outbound SMTP

### Issue: "Failed to decode Base64"

**Solution:**
- ✅ Ensure `resumeBase64` and `jdBase64` are valid Base64 strings
- ✅ They should be Base64 encoded PDF files
- ✅ No spaces or line breaks allowed

### Issue: "Attachment failed"

**Solution:**
- ✅ Ensure Base64 decoding succeeded
- ✅ Check temp directory has write permissions
- ✅ Verify PDF files can be opened

---

## 📊 Logging

The service logs all actions:

```
✅ Decoded file: C:\Temp\hirelens_resume.pdf (45678 bytes)
📤 Sending candidate email to: john@example.com
📥 Attached: John_Doe_resume.pdf
📥 Attached: Senior_AI_Engineer_jd.pdf
✅ Candidate email sent to john@example.com
📤 Sending interviewer email to: jane@hirelens.com
✅ Interviewer email sent to jane@hirelens.com
✅ Cleaned up temp file: C:\Temp\hirelens_resume.pdf
```

---

## 💡 Testing

### Option 1: Swagger UI

```
http://localhost:8000/docs
```

1. Navigate to `/send-interview-email`
2. Click "Try it out"
3. Fill in the request body
4. Click "Execute"
5. See response in real-time

### Option 2: Python Script

```python
import requests

payload = {
    "interviewId": "123",
    "candidateName": "John Doe",
    "candidateEmail": "john@example.com",
    # ... rest of fields
}

response = requests.post(
    "http://localhost:8000/send-interview-email",
    json=payload
)

print(response.json())
```

### Option 3: Test Email Locally

Before production, test with your own email:

```json
{
  "candidateEmail": "your_email@gmail.com",
  "interviewerEmail": "your_email@gmail.com",
  // ... rest of fields
}
```

---

## 🚀 Production Deployment

1. **Update .env with production SMTP credentials**
2. **Test with real emails before going live**
3. **Enable email logging for troubleshooting**
4. **Monitor email delivery in SMTP provider dashboard**
5. **Set up email bounce/failure alerts** (optional)

---

## 📝 Notes

- Emails are sent synchronously (blocking)
- If one email fails, the other may still succeed
- All PDFs are cleaned up after sending
- Email sending is logged for audit trail
- Variable substitution is case-sensitive

---

## 👨‍💻 .NET Backend Integration Example

```csharp
using System.Net.Http;
using System.Text.Json;

// Create request
var request = new
{
    interviewId = "550e8400-e29b-41d4-a716-446655440000",
    candidateName = "John Doe",
    candidateEmail = "john@example.com",
    // ... other fields
    resumeBase64 = Convert.ToBase64String(resumePdfBytes),
    jdBase64 = Convert.ToBase64String(jdPdfBytes)
};

// Call API
var httpClient = new HttpClient();
var jsonContent = JsonSerializer.Serialize(request);
var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

var response = await httpClient.PostAsync(
    "http://localhost:8000/send-interview-email",
    content
);

var result = JsonSerializer.Deserialize<SendInterviewEmailResponse>(
    await response.Content.ReadAsStringAsync()
);

if (result.Success)
{
    Console.WriteLine("✅ Emails sent successfully");
}
else
{
    Console.WriteLine($"❌ Error: {result.Error}");
}
```

---

**All set! Email service is ready to use.** 🎉
