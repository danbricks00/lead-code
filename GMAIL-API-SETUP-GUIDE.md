# Gmail API Setup Guide - Fix "Precondition check failed" Error

## 🔍 Problem Diagnosis

The "Precondition check failed" error occurs when the service account doesn't have permission to send emails on behalf of the Gmail account. This is a common issue with Gmail API authentication.

## 🛠️ Solution: Domain-Wide Delegation Setup

### Step 1: Enable Domain-Wide Delegation

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to Service Accounts**
   - Go to "IAM & Admin" > "Service Accounts"
   - Find your service account (the one with the email in `GOOGLE_CLIENT_EMAIL`)

3. **Enable Domain-Wide Delegation**
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the key file

### Step 2: Configure Google Workspace Admin Console

1. **Access Google Workspace Admin Console**
   - Visit: https://admin.google.com/
   - Sign in with your admin account

2. **Navigate to Security Settings**
   - Go to "Security" > "API Controls" > "Domain-wide Delegation"

3. **Add Service Account**
   - Click "Add new"
   - **Client ID**: Use the `client_id` from your service account JSON file
   - **OAuth Scopes**: Add this exact scope:
     ```
     https://www.googleapis.com/auth/gmail.send
     ```
   - Click "Authorize"

### Step 3: Verify Environment Variables

Ensure these environment variables are set in Vercel:

```bash
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Important**: The private key must include the `\n` characters for line breaks.

### Step 4: Test the Configuration

1. **Deploy the updated code**
2. **Test the Gmail API endpoint**:
   ```
   https://your-domain.vercel.app/api/test-gmail-simple
   ```
3. **Submit a contact form** to test the full flow

## 🔧 Alternative Solution: OAuth 2.0 with User Impersonation

If domain-wide delegation doesn't work, try this alternative approach:

### Step 1: Create OAuth 2.0 Credentials

1. **Go to Google Cloud Console**
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs

### Step 2: Update the Code

Replace the service account authentication with OAuth 2.0:

```javascript
const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Set credentials (you'll need to get these from a token exchange)
auth.setCredentials({
    access_token: process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});
```

## 🚨 Common Issues and Solutions

### Issue 1: "Precondition check failed"
**Solution**: Enable domain-wide delegation as described above

### Issue 2: "Insufficient permissions"
**Solution**: 
- Check if Gmail API is enabled in Google Cloud Console
- Verify the service account has the correct scopes
- Ensure the admin account has permission to configure domain-wide delegation

### Issue 3: "Invalid credentials"
**Solution**:
- Verify environment variables are correctly set
- Check that the private key includes proper line breaks
- Ensure the service account email matches the one in your environment variables

### Issue 4: "Quota exceeded"
**Solution**:
- Check Gmail API quotas in Google Cloud Console
- Consider implementing rate limiting
- Monitor usage in the Google Cloud Console

## 📋 Verification Checklist

- [ ] Gmail API enabled in Google Cloud Console
- [ ] Service account created with proper permissions
- [ ] Domain-wide delegation configured in Google Workspace Admin
- [ ] Environment variables set correctly in Vercel
- [ ] Test endpoint returns success
- [ ] Contact form sends emails successfully

## 🔍 Debugging Commands

### Test Gmail API Authentication
```bash
curl https://your-domain.vercel.app/api/test-gmail-simple
```

### Check Environment Variables
The test endpoint will show if your environment variables are properly set.

### Monitor Logs
Check Vercel function logs for detailed error messages and debugging information.

## 📞 Support

If you're still experiencing issues after following this guide:

1. **Check Vercel logs** for detailed error messages
2. **Verify Google Cloud Console** settings
3. **Test with the diagnostic endpoint** first
4. **Ensure all environment variables** are correctly set

The updated code includes comprehensive error logging to help identify the specific issue.
