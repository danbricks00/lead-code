# Environment Variables for Google Auth Control System

This document outlines all the environment variables required for the Google authentication control system.

## Required Environment Variables

### Google OAuth Configuration
```bash
# Google OAuth Client ID (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here

# Google OAuth Client Secret (from Google Cloud Console)
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Google OAuth Redirect URI (must match your app's callback URL)
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google
```

### Google Sheets Configuration
```bash
# Google Sheets API Service Account Email
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Google Sheets API Private Key (with \n replaced with actual newlines)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Google Sheet ID for storing registered users
USER_SHEET_ID=your_users_sheet_id_here
```

### Authentication Control Variables
```bash
# Backend control - enables/disables Google auth globally
ALLOW_GOOGLE_AUTH=true

# Frontend control - shows/hides Google sign-in button
NEXT_PUBLIC_ALLOW_GOOGLE_AUTH=true
```

## Setting Up Environment Variables

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Sheets API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure OAuth consent screen
6. Create OAuth 2.0 client ID for web application
7. Add authorized redirect URIs:
   - `https://your-domain.com/api/auth/google` (for custom OAuth)
   - `https://your-domain.com/api/auth/callback/google` (for NextAuth.js)

### 2. Google Sheets Service Account
1. In Google Cloud Console, go to "IAM & Admin" → "Service Accounts"
2. Create a new service account
3. Download the JSON key file
4. Share your Google Sheets with the service account email
5. Extract the `client_email` and `private_key` from the JSON file

### 3. Google Sheets Setup
Create a Google Sheet with the following structure:

**Sheet Name: "Users"**
| Column A |
|----------|
| Email    |
| user1@example.com |
| user2@example.com |

**Sheet Name: "Quotes"** (existing)
| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ID | Lead ID | Customer Name | Customer Address | Tradesman Email | Tradesman Name | Tradesman Phone | Labour Rate | Labour Hours | Materials | Status | Decline Reason | Decline Notes | Decline Time | Resubmission Used |

## Environment Variable Combinations

### All Users Allowed
```bash
ALLOW_GOOGLE_AUTH=true
NEXT_PUBLIC_ALLOW_GOOGLE_AUTH=true
```
- Google sign-in enabled
- Any Google account can attempt sign-in
- Only registered users (in Google Sheet) can actually sign in

### Registered Users Only
```bash
ALLOW_GOOGLE_AUTH=true
NEXT_PUBLIC_ALLOW_GOOGLE_AUTH=true
```
- Google sign-in enabled
- Only users in the "Users" Google Sheet can sign in
- Non-registered users get "Access Denied" error

### Completely Disabled
```bash
ALLOW_GOOGLE_AUTH=false
NEXT_PUBLIC_ALLOW_GOOGLE_AUTH=false
```
- Google sign-in completely disabled
- Frontend shows "temporarily unavailable" message
- Backend returns 403 errors

## Vercel Deployment

### Setting Environment Variables in Vercel
1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add each variable with the appropriate value
4. Make sure to set the correct environment (Production, Preview, Development)

### Important Notes for Vercel
- `NEXT_PUBLIC_` prefix makes variables available to the browser
- Variables without `NEXT_PUBLIC_` are only available server-side
- Private keys should be properly formatted with actual newlines
- Redeploy after adding new environment variables

## Security Considerations

### Environment Variable Security
- Never commit environment variables to version control
- Use `.env.local` for local development
- Use Vercel's environment variable system for production
- Rotate keys regularly

### Google Sheets Security
- Only share necessary sheets with service account
- Use least privilege principle
- Monitor API usage in Google Cloud Console

### OAuth Security
- Use HTTPS in production
- Validate redirect URIs
- Implement proper session management
- Use secure, HTTP-only cookies

## Troubleshooting

### Common Issues

1. **"Google sign-in is temporarily disabled"**
   - Check `ALLOW_GOOGLE_AUTH` is set to `true`
   - Verify `NEXT_PUBLIC_ALLOW_GOOGLE_AUTH` is set to `true`

2. **"This Google account is not registered"**
   - Check if user email exists in "Users" Google Sheet
   - Verify `USER_SHEET_ID` is correct
   - Check service account has access to the sheet

3. **OAuth errors**
   - Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
   - Check `GOOGLE_REDIRECT_URI` matches your domain
   - Ensure OAuth consent screen is configured

4. **Google Sheets API errors**
   - Verify `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` are correct
   - Check service account has access to sheets
   - Ensure Google Sheets API is enabled

### Debug Mode
Add this environment variable for detailed logging:
```bash
DEBUG_AUTH=true
```

## Example .env.local File
```bash
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google

# Google Sheets
GOOGLE_CLIENT_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
USER_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

# Auth Controls
ALLOW_GOOGLE_AUTH=true
NEXT_PUBLIC_ALLOW_GOOGLE_AUTH=true

# Debug
DEBUG_AUTH=true
```
