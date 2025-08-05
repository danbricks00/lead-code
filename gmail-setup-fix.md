# Gmail API Setup Fix - Automatic Email Sending

## Current Issue
The Gmail API is failing because the service account needs proper permissions to send emails.

## Quick Fix Steps

### 1. Enable Gmail API in Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `gen-lang-client-0275886506`
3. Go to **APIs & Services** > **Library**
4. Search for "Gmail API"
5. Click on "Gmail API" and click **Enable**

### 2. Update Service Account Permissions
1. Go to **IAM & Admin** > **Service Accounts**
2. Find your service account: `personaltest@gen-lang-client-0275886506.iam.gserviceaccount.com`
3. Click on it and go to **Permissions** tab
4. Click **Grant Access**
5. Add these roles:
   - **Gmail API User**
   - **Service Account Token Creator**
6. Click **Save**

### 3. Alternative: Use Domain-Wide Delegation
If the above doesn't work, set up domain-wide delegation:

1. In your service account, go to **Keys** tab
2. Create a new key (JSON) if you don't have one
3. Note the **Client ID** from the service account
4. In your Google Workspace admin:
   - Go to **Security** > **API Controls** > **Domain-wide Delegation**
   - Add your service account's Client ID
   - Add this scope: `https://www.googleapis.com/auth/gmail.send`

### 4. Test the Setup
After making these changes:
1. Restart your server: `npm start`
2. Submit a test lead
3. Check if emails are sent automatically

## Expected Result
After fixing, you should see:
```
✅ Email sent to tradesman: danbricks18@gmail.com
✅ Confirmation email sent to customer: [customer-email]
```

## If Still Not Working
The service account approach might be limited. We can switch to:
1. **OAuth2 with refresh tokens** (more complex but reliable)
2. **Different email service** (SendGrid, Mailgun, etc.)

Let me know if you need help with any of these steps! 