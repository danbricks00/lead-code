# Google OAuth Setup Guide - Fix Origin Error

## Problem
You're getting the error: "The given origin is not allowed for the given client ID"

**NEW ISSUE**: Google Cloud Console now blocks `localhost` and `127.0.0.1` in authorized origins with the error: "Invalid Origin: must end with a public top-level domain (such as .com or .org)."

## Solution Options

### Option 1: Use ngrok (Recommended for Development)

ngrok creates a secure tunnel to your localhost with a public domain.

#### Step 1: Install ngrok
1. Go to https://ngrok.com/
2. Sign up for a free account
3. Download ngrok for Windows
4. Extract the ngrok.exe file to your project folder

#### Step 2: Start your server
```bash
npm start
```

#### Step 3: Start ngrok tunnel
```bash
ngrok http 3000
```

#### Step 4: Update Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add the ngrok URL to "Authorized JavaScript origins":
   - `https://your-ngrok-url.ngrok.io` (replace with your actual ngrok URL)
5. Add to "Authorized redirect URIs":
   - `https://your-ngrok-url.ngrok.io/login`
   - `https://your-ngrok-url.ngrok.io/`
6. Click Save

#### Step 5: Test
1. Go to your ngrok URL: `https://your-ngrok-url.ngrok.io/login`
2. Try the Google Sign-In button

### Option 2: Use a Local Domain (Alternative)

#### Step 1: Edit Windows Hosts File
1. Open Notepad as Administrator
2. Open file: `C:\Windows\System32\drivers\etc\hosts`
3. Add this line at the end:
   ```
   127.0.0.1 leadbot.local
   ```
4. Save the file

#### Step 2: Update Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add to "Authorized JavaScript origins":
   - `http://leadbot.local:3000`
5. Add to "Authorized redirect URIs":
   - `http://leadbot.local:3000/login`
   - `http://leadbot.local:3000/`
6. Click Save

#### Step 3: Test
1. Go to `http://leadbot.local:3000/login`
2. Try the Google Sign-In button

### Option 3: Use a Real Domain (Production Ready)

If you have a domain name:
1. Add your domain to Google Cloud Console authorized origins
2. Deploy your app to a hosting service (Heroku, Vercel, etc.)
3. Use your real domain for testing

## Quick Test with ngrok

1. **Download ngrok** from https://ngrok.com/
2. **Extract ngrok.exe** to your project folder
3. **Start your server**: `npm start`
4. **In a new terminal, run**: `ngrok http 3000`
5. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)
6. **Add this URL** to Google Cloud Console authorized origins
7. **Test at**: `https://abc123.ngrok.io/login`

## Troubleshooting

### ngrok Issues
- **"ngrok is not recognized"**: Make sure ngrok.exe is in your PATH or run it from the project folder
- **"tunnel not found"**: Check that your server is running on port 3000
- **"authtoken required"**: Sign up for a free ngrok account and get your authtoken

### Still getting origin errors?
1. **Double-check the exact URL** you added to Google Cloud Console
2. **Make sure you're using HTTPS** for ngrok URLs
3. **Wait 5-10 minutes** for changes to propagate
4. **Clear browser cache** and try again

### Getting different errors?
- **"redirect_uri_mismatch"**: Add the exact URLs to redirect URIs
- **"invalid_client"**: Check your client ID is correct
- **"access_denied"**: User denied permission

## Security Notes
- ngrok URLs are public and temporary (free tier)
- For production, use a real domain
- Never commit OAuth credentials to public repositories
- Consider using environment variables for sensitive data

## Next Steps
Once Google Sign-In works:
1. Test the registration flow
2. Test the login flow
3. Check that tradesmen are being stored in the database
4. Test the admin panel 