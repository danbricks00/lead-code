# Vercel Deployment Guide - Get a Real Domain for Google OAuth

## Why Vercel?
- Free hosting with a real domain (your-project.vercel.app)
- Automatic HTTPS
- Easy deployment from GitHub
- Perfect for development and testing

## Step 1: Prepare Your Code

### Create a Vercel Configuration File
Create a file called `vercel.json` in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

### Update Package.json
Make sure your `package.json` has the correct start script:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/
2. Create a new repository
3. Upload your project files:
   - All HTML files
   - server.js
   - package.json
   - config files
   - **EXCLUDE**: node_modules folder
   - **EXCLUDE**: service_account_key.json (for security)

## Step 3: Deploy to Vercel

1. Go to https://vercel.com/
2. Sign up with your GitHub account
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

## Step 4: Get Your Domain

After deployment, Vercel will give you a URL like:
`https://your-project-name.vercel.app`

## Step 5: Update Google Cloud Console

1. Go to https://console.cloud.google.com/
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add to "Authorized JavaScript origins":
   - `https://your-project-name.vercel.app`
5. Add to "Authorized redirect URIs":
   - `https://your-project-name.vercel.app/login`
   - `https://your-project-name.vercel.app/`
6. Click Save

## Step 6: Test

1. Go to your Vercel URL: `https://your-project-name.vercel.app/login`
2. Try the Google Sign-In button
3. The popup should now appear!

## Environment Variables (Important)

For security, set these in Vercel:
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add your sensitive data:
   - `GOOGLE_API_KEY`
   - `SPREADSHEET_ID`
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`

## Troubleshooting

### Deployment Issues
- Make sure all files are uploaded to GitHub
- Check that `vercel.json` is in the root directory
- Ensure `package.json` has correct dependencies

### Google OAuth Issues
- Wait 5-10 minutes after updating Google Cloud Console
- Clear browser cache
- Try incognito mode

### Environment Variables
- Make sure sensitive data is in Vercel environment variables
- Don't commit API keys to GitHub

## Next Steps

Once deployed and working:
1. Test the full lead generation flow
2. Test tradesman registration
3. Test admin panel
4. Share your live URL with others

## Benefits of Vercel Deployment

✅ **Real domain** (meets Google's requirements)
✅ **Free hosting**
✅ **Automatic HTTPS**
✅ **Easy updates** (just push to GitHub)
✅ **No antivirus issues**
✅ **Professional URL** 