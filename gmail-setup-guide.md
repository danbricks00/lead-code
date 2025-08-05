# Gmail API Setup Guide

## Step 1: Enable Gmail API in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Library"
4. Search for "Gmail API"
5. Click on "Gmail API" and press "Enable"

## Step 2: Update Service Account Permissions

1. Go to "IAM & Admin" → "Service Accounts"
2. Click on your service account
3. Make sure it has these roles:
   - "Editor" for the project
   - "Service Account Token Creator"
   - "Gmail API User" (if available)

## Step 3: Configure Gmail API Scopes

The service account needs the following scopes:
- `https://www.googleapis.com/auth/gmail.send` - To send emails
- `https://www.googleapis.com/auth/spreadsheets` - To write to Google Sheets

## Step 4: Update Tradesmen Emails

Edit the `tradesmen-config.js` file and replace the example emails with real tradesmen email addresses:

```javascript
const tradesmenConfig = {
    builder: [
        'real-builder1@example.com',
        'real-builder2@example.com'
    ],
    electrician: [
        'real-electrician1@example.com',
        'real-electrician2@example.com'
    ],
    plumber: [
        'real-plumber1@example.com',
        'real-plumber2@example.com'
    ],
    other: [
        'real-handyman@example.com'
    ]
};
```

## Step 5: Test the Integration

1. Restart your server: `npm start`
2. Complete a lead form through the chatbot
3. Check the console for email sending status
4. Verify emails are received by tradesmen and customer

## How It Works

When a lead is submitted:

1. **Data is saved to Google Sheets** (if configured)
2. **Email sent to tradesmen** with project details
3. **Confirmation email sent to customer**

### Email Content

**Tradesmen Email includes:**
- Service required
- Customer contact details
- Project description
- Location, budget, timeline
- Request to contact customer

**Customer Email includes:**
- Confirmation of request
- Project details summary
- Expected response time
- Contact information

## Troubleshooting

### Common Issues:

1. **"Gmail API not enabled"**
   - Enable Gmail API in Google Cloud Console

2. **"Permission denied"**
   - Check service account permissions
   - Ensure Gmail API scope is included

3. **"Emails not sending"**
   - Verify tradesmen email addresses are correct
   - Check Gmail API quotas and limits

4. **"Service account authentication failed"**
   - Verify service account key file exists
   - Check key file permissions

## Security Notes

- Keep your service account key secure
- Don't commit the key file to version control
- Use environment variables in production
- Regularly rotate service account keys

## Production Considerations

For production use:
1. Use a dedicated Gmail account for sending
2. Set up proper email templates
3. Implement email tracking
4. Add rate limiting
5. Set up monitoring and alerts 