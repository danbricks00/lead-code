# Gmail App Password Update Guide

## After Changing Google Account Password

When you change your Google account password, all existing App Passwords become invalid. You need to generate a new one.

## Step-by-Step Instructions

### 1. Generate New App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", find **2-Step Verification**
   - If 2-Step Verification is NOT enabled, you MUST enable it first (App Passwords require 2-Step Verification)
4. Scroll down to **App passwords** (or search for it)
5. Click **App passwords**
6. You may need to sign in again
7. Select app: Choose **Mail**
8. Select device: Choose **Other (Custom name)**
9. Enter name: `Heat.nz Vercel` (or any name you prefer)
10. Click **Generate**
11. **COPY THE 16-CHARACTER PASSWORD** (it will look like: `abcd efgh ijkl mnop`)
   - ⚠️ **IMPORTANT**: Copy it immediately - you can only see it once!
   - Remove all spaces when using it (should be 16 characters total)

### 2. Update Vercel Environment Variable

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `GMAIL_APP_PASSWORD`
5. Click **Edit** (or the three dots menu → Edit)
6. Paste the new 16-character password (WITHOUT spaces)
   - Example: `abcdefghijklmnop` (not `abcd efgh ijkl mnop`)
7. Click **Save**
8. **Redeploy your application** (important!)
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Click **Redeploy**
   - OR make a small code change and push to trigger a new deployment

### 3. Verify It Works

1. Submit a test contact form on your website
2. Check Vercel logs:
   - Go to **Deployments** → Click on latest deployment → **Functions** tab
   - Look for email sending logs
   - Should see: `✅ Contact form email sent to admin successfully`
3. Check your email inbox for the test submission

## Troubleshooting

### If emails still fail:

1. **Verify the password format:**
   - Should be exactly 16 characters
   - No spaces
   - No quotes around it in Vercel

2. **Check GMAIL_USER:**
   - Should be your full Gmail address
   - Example: `your-email@gmail.com`
   - No extra spaces or quotes

3. **Verify 2-Step Verification is enabled:**
   - App Passwords won't work without 2-Step Verification

4. **Check Vercel logs for specific error:**
   - Look for error messages like "Invalid login" or "Bad credentials"
   - These will tell you exactly what's wrong

## Quick Checklist

- [ ] 2-Step Verification enabled on Google Account
- [ ] New App Password generated (16 characters)
- [ ] App Password copied (without spaces)
- [ ] GMAIL_APP_PASSWORD updated in Vercel
- [ ] Application redeployed in Vercel
- [ ] Test submission sent successfully
- [ ] Email received in inbox

## Important Notes

- **App Passwords are different from your regular Google password**
- You can have multiple App Passwords for different services
- Each App Password is 16 characters
- App Passwords don't expire unless you revoke them or change your main password
- If you change your Google password again, you'll need to repeat this process

