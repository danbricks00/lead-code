# Vercel Fix Guide - Resolve 500 Error

## Problem
Your Vercel deployment is showing a 500 error because the server is trying to read files that don't exist in the serverless environment.

## Solution Steps

### Step 1: Add Environment Variables to Vercel

1. **Go to** your Vercel dashboard: https://vercel.com/dashboard
2. **Click on your project**: lead-code-git-main-dan-buis-projects
3. **Go to Settings → Environment Variables**
4. **Add these variables**:

```
GOOGLE_API_KEY = AIzaSyBIrLJFnsSiub7Ixio_v2S9gDT8mxkRuwM
SPREADSHEET_ID = your-google-sheet-id
GMAIL_USER = danbricks18@gmail.com
GMAIL_APP_PASSWORD = ptmcojqgthvjbqom
SESSION_SECRET = your-secret-key-here
```

### Step 2: Update Your GitHub Repository

1. **Go to** your GitHub repository
2. **Upload the new files** I created:
   - `server-vercel.js` (Vercel-compatible server)
   - `api/index.js` (API route handler)
   - Updated `vercel.json` (new configuration)

### Step 3: Redeploy

1. **Go back to Vercel dashboard**
2. **Click "Redeploy"** on your project
3. **Wait for deployment to complete**

### Step 4: Test

1. **Go to**: https://lead-code-git-main-dan-buis-projects-e44a173c.vercel.app/login
2. **The page should now load without errors**

## What I Fixed

1. **Created `server-vercel.js`**: A Vercel-compatible version that uses environment variables instead of file-based configuration
2. **Created `api/index.js`**: Proper API route handler for Vercel serverless functions
3. **Updated `vercel.json`**: Simplified configuration that routes everything through the API
4. **Removed file dependencies**: No more reliance on `service_account_key.json` or other local files

## Environment Variables Explained

- `GOOGLE_API_KEY`: Your Google API key for Sheets access
- `SPREADSHEET_ID`: Your Google Sheet ID (get this from your sheet URL)
- `GMAIL_USER`: Your Gmail address for sending emails
- `GMAIL_APP_PASSWORD`: Your Gmail app password
- `SESSION_SECRET`: A random string for session security

## Get Your Spreadsheet ID

1. **Open your Google Sheet**
2. **Copy the URL**: `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit`
3. **Extract the ID** (the long string between `/d/` and `/edit`)

## After Fix

Once the deployment works:
1. **Test the main site**: https://lead-code-git-main-dan-buis-projects-e44a173c.vercel.app/
2. **Test the login**: https://lead-code-git-main-dan-buis-projects-e44a173c.vercel.app/login
3. **Update Google Cloud Console** with your Vercel domain
4. **Test Google Sign-In**

## Troubleshooting

### Still getting 500 error?
1. **Check Vercel logs**: Go to Functions tab in your Vercel dashboard
2. **Verify environment variables**: Make sure all are set correctly
3. **Check deployment status**: Ensure the latest code is deployed

### Google Sign-In not working?
1. **Update Google Cloud Console** with your Vercel domain
2. **Wait 5-10 minutes** for changes to propagate
3. **Clear browser cache** and try again 