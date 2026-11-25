# Google OAuth Authorization Error Fix

## Error: "Access blocked: Authorization Error - origin_mismatch"

This error occurs because the JavaScript origins in Google Cloud Console don't match your current domain.

## Fix Steps:

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Select your project

### 2. Navigate to OAuth 2.0 Client IDs
- Go to "APIs & Services" → "Credentials"
- Find your OAuth 2.0 Client ID (Web application)
- Click on it to edit

### 3. Update Authorized JavaScript Origins
Add these URLs to the "Authorized JavaScript origins" list:

```
https://heat.nz
http://localhost:3000
http://localhost:3001
```

### 4. Update Authorized Redirect URIs
Add these URLs to the "Authorized redirect URIs" list:

```
https://heat.nz/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
```

### 5. Save Changes
- Click "Save" at the bottom
- Wait 5-10 minutes for changes to propagate

### 6. Test
- Try logging in again
- The OAuth error should be resolved

## Important Notes:
- The domain must match EXACTLY (including https://)
- Changes can take up to 10 minutes to take effect
- Make sure you're using the correct OAuth client ID
- If you have multiple OAuth clients, update the one being used by your app

## Current Vercel URLs:
- Production: `https://heat.nz`
