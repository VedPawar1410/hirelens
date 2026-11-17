import requests
import json
import base64
from datetime import datetime, timedelta

def test_email_service():
    """Test email service with valid Base64 PDFs"""
    
    # Create a valid minimal PDF Base64 (small but valid PDF)
    VALID_PDF_BASE64 = (
        "JVBERi0xLjQKJeLjz9MNCjEgMCBvYmo8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PmVu"
        "ZG9iajIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iajMg"
        "MCBvYmo8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSA0"
        "IDAgUj4+Pj4vTWVkaWFCb3hbMCAwIDYxMiA3OTJdL0NvbnRlbnRzIDUgMCBSPj5lbmRvYmoK"
        "NCAwIG9iajw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYT4+"
        "ZW5kb2JqNSAwIG9iajw8L0xlbmd0aCA0ND4+c3RyZWFtCkJUIC9GMSA0IFRmCjEwMCA3NTAg"
        "VGQgKEludGVydmlldyBTY2hlZHVsZSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAg"
        "NgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA3NCAw"
        "MDAwMCBuIAowMDAwMDAwMTIwIDAwMDAwIG4gCjAwMDAwMDAyNzkgMDAwMDAgbiAKMDAwMDAw"
        "MDM3NyAwMDAwMCBuIAp0cmFpbGVyPDwvU2l6ZSA2L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYK"
        "NDcxCiUlRU9GCg=="
    )
    
    # Calculate future time
    start_time = datetime.now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=1)
    
    payload = {
        "interviewId": "550e8400-e29b-41d4-a716-446655440000",
        "candidateName": "John Doe",
        "candidateEmail": "candidate@example.com",  # Your email
        "interviewerName": "Jane Smith",
        "interviewerEmail": "interviewer@example.com",  # Your email
        "jobTitle": "Senior AI Engineer",
        "companyName": "Acme Corp",
        "interviewRound": "L1",
        "interviewType": "Technical",
        "interviewMode": "online",
        "startTime": start_time.isoformat(),
        "endTime": end_time.isoformat(),
        "durationMinutes": 60,
        "timezone": "Asia/Kolkata",
        "meetingLink": "https://teams.microsoft.com/l/meetup-join/19:meeting_abc123",
        "location": None,
        "createdByUserName": "HR Admin",
        "createdByUserEmail": "hr@example.com",
        "resumeBase64": VALID_PDF_BASE64,
        "jdBase64": VALID_PDF_BASE64,
        "additionalInstructions": "Please prepare coding questions on Python and system design"
    }
    
    print("📤 Sending email request...")
    response = requests.post(
        "http://localhost:8000/send-interview-email",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print("\n" + "="*70)
    print("📥 RESPONSE:")
    print("="*70)
    print(f"Status Code: {response.status_code}\n")
    print(json.dumps(response.json(), indent=2))
    print("="*70)
    
    if response.status_code == 200:
        result = response.json()
        if result.get("success"):
            print("\n✅ SUCCESS! Check your inbox for the test emails.")
        else:
            print(f"\n❌ FAILED: {result.get('error')}")
    else:
        print(f"\n❌ ERROR: Status {response.status_code}")

if __name__ == "__main__":
    test_email_service()