# Vercel Environment Variables Setup

## Required Environment Variables

To fix the email sending issues in your Vercel deployment, you need to set the following environment variables:

### 1. Gmail Configuration
- **GMAIL_USER**: Your Gmail address (e.g., `danbricks18@gmail.com`)
- **GMAIL_APP_PASSWORD**: Your Gmail app password (not your regular password)

### 2. Google Sheets Configuration
- **GOOGLE_CLIENT_EMAIL**: Your service account email from Google Cloud
- **GOOGLE_PRIVATE_KEY**: Your service account private key
- **GOOGLE_SPREADSHEET_ID**: Your Google Sheets ID

### 3. Vercel Configuration
- **VERCEL_URL**: Your Vercel deployment URL (auto-set by Vercel)
- **NODE_ENV**: Set to `production`

## How to Set Environment Variables in Vercel

### Option 1: Vercel Dashboard
1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the left sidebar
4. Add each variable:
   - **Name**: `GMAIL_USER`
   - **Value**: `danbricks18@gmail.com`
   - **Environment**: Production (and Preview if you want)
5. Repeat for all variables

### Option 2: Vercel CLI
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add GMAIL_USER
vercel env add GMAIL_APP_PASSWORD
vercel env add GOOGLE_CLIENT_EMAIL
vercel env add GOOGLE_PRIVATE_KEY
vercel env add GOOGLE_SPREADSHEET_ID

# Deploy with new environment variables
vercel --prod
```

## Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Use this password as your `GMAIL_APP_PASSWORD`

## Important Notes

- **Never commit real passwords to your code**
- The current hardcoded password in your code should be removed
- Environment variables are encrypted and secure in Vercel
- After setting environment variables, redeploy your application

## Testing

After setting up the environment variables:

1. Test the email system using `/api/test-email`
2. Submit a test quote to verify the full flow
3. Check Vercel function logs for any errors

## Troubleshooting

If emails still don't send:
1. Check Vercel function logs
2. Verify environment variables are set correctly
3. Test Gmail authentication separately
4. Check if your Gmail account has any restrictions
