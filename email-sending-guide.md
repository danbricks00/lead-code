# Email Sending Guide

## Current Status
The Gmail API is having authentication issues. While we fix this, you can manually send the emails using the information provided in the console.

## How to Send Emails Manually

### 1. Copy Email Details from Console
When you submit a lead, the server console will show:
```
📋 EMAIL SUMMARY FOR MANUAL SENDING:
=====================================
TRADESMEN EMAILS:
1. To: [email]
   Subject: [subject]
   Body: [formatted email content]

CUSTOMER EMAIL:
To: [customer-email]
Subject: [subject]
Body: [formatted email content]
=====================================
```

### 2. Send Emails Using Gmail Web Interface
1. Go to [Gmail](https://mail.google.com)
2. Click "Compose"
3. Copy the details from the console:
   - **To**: Copy the email address
   - **Subject**: Copy the subject line
   - **Body**: Copy the body content (remove the `\n` characters)

### 3. Alternative: Use Email Client
You can also use Outlook, Thunderbird, or any email client to send the emails.

## Quick Email Templates

### For Tradesmen:
**Subject**: New Lead: [service] Project in [location]

**Body**:
```
New Lead Received

Service Required: [service]
Customer Name: [name]
Customer Email: [email]
Customer Phone: [phone]
Location: [location]
Project Details: [details]
Project Size: [size]
Specific Requirements: [requirements]
Budget: [budget]
Timeline: [timeline]
Date: [date]

Please contact the customer directly to discuss this project.
```

### For Customer:
**Subject**: Your Project Request - LeadBot

**Body**:
```
Thank you for your project request!

Dear [name],

We have received your request for [service] services and have forwarded it to qualified tradesmen in your area.

Project Details:
- Service: [service]
- Location: [location]
- Project: [details]
- Size/Scope: [size]
- Specific Requirements: [requirements]
- Budget: [budget]
- Timeline: [timeline]

Qualified tradesmen will contact you within 24 hours to discuss your project and provide quotes.

If you have any questions, please don't hesitate to contact us.

Best regards,
The LeadBot Team
```

## Next Steps
We're working on fixing the Gmail API authentication. Once resolved, emails will be sent automatically. 