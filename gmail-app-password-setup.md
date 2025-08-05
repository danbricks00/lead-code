# Gmail App Password Setup - Real Email Sending

## Why You Need This
The current system uses Ethereal Email (test service) which only provides preview URLs but doesn't actually send emails to real addresses. To send real emails, you need to set up Gmail SMTP with an App Password.

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication on Your Gmail
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on "Security"
3. Under "Signing in to Google", click "2-Step Verification"
4. Follow the steps to enable it

### 2. Generate an App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on "Security"
3. Under "Signing in to Google", click "App passwords"
4. Select "Mail" as the app
5. Select "Other" as the device
6. Enter "LeadBot" as the name
7. Click "Generate"
8. **Copy the 16-character password** (it looks like: xxxx xxxx xxxx xxxx)

### 3. Update the Server Code
1. Open `server.js`
2. Find this line:
   ```javascript
   pass: 'your-app-password-here' // You'll need to generate an app password
   ```
3. Replace `'your-app-password-here'` with your actual app password (without spaces)
4. Save the file

### 4. Restart the Server
```bash
npm start
```

## Alternative: Use Your Own Email Service
If you prefer to use a different email service (like Outlook), you can modify the SMTP settings:

```javascript
const transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com', // For Outlook
    port: 587,
    secure: false,
    auth: {
        user: 'your-email@outlook.com',
        pass: 'your-password'
    }
});
```

## Test the Setup
1. Submit a lead through the chatbot
2. Check your email inbox
3. You should receive real emails!

## Security Note
- Never commit your app password to version control
- Consider using environment variables for production
- The app password is only for this specific application

## Troubleshooting
- If you get "Invalid login" error, double-check your app password
- If you get "Less secure app access" error, make sure 2FA is enabled
- If emails still don't send, check your spam folder 