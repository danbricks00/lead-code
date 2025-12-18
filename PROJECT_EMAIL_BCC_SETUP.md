# Project Email BCC Setup Guide

## Overview

The contact form and quote enquiry system now supports hidden BCC (Blind Carbon Copy) to project-specific temp email addresses. This allows you and the customer to have a shared inbox for each project.

## How It Works

1. **Project Email Generation:**
   - For **contact form**: `project-{randomId}@yourdomain.com`
   - For **quote enquiries**: `project-{leadId}@yourdomain.com`
   
2. **BCC Recipients:**
   - Project temp email (shared inbox)
   - Customer email (so they also receive a copy)

3. **Visibility:**
   - Admin/Tradesperson see the email in "To" field
   - Project email and customer are in "BCC" (hidden from each other)
   - Only you and the customer can see the BCC

## Setup Instructions

### Step 1: Configure Email Domain

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `PROJECT_EMAIL_DOMAIN`
   - **Value:** Your email domain (e.g., `heat.nz` or `yourdomain.com`)
   - **Example:** If you want emails like `project-abc123@heat.nz`, set it to `heat.nz`

### Step 2: Email Routing Options

You have several options for handling the project emails:

#### Option A: Use Your Own Domain with Email Forwarding
1. Set up email forwarding on your domain
2. Forward `project-*@yourdomain.com` to your main email
3. All project emails will arrive in your inbox

#### Option B: Use a Temp Email Service
1. Use a service like:
   - **Mailinator** (free, public inboxes)
   - **TempMail** (temporary emails)
   - **10MinuteMail** (self-destructing)
2. Set `PROJECT_EMAIL_DOMAIN` to their domain
3. Access the inbox using the generated email address

#### Option C: Use Gmail with Plus Addressing
1. Gmail supports `+` addressing: `yourname+project-abc123@gmail.com`
2. Set `PROJECT_EMAIL_DOMAIN` to `gmail.com`
3. Modify the code to use `yourname+project-{id}@gmail.com` format
4. All emails will arrive in your Gmail inbox, filterable by the `+project-*` part

#### Option D: Use a Shared Inbox Service
1. Services like **Front**, **Help Scout**, or **Zendesk**
2. Create a shared inbox
3. Set up email forwarding to that inbox

### Step 3: Redeploy

After setting the environment variable:
1. Go to **Deployments** → Latest deployment
2. Click **Redeploy** (or push a code change)
3. The BCC feature will be active

## Example Email Flow

### Contact Form Submission:
```
To: admin@heat.nz
BCC: project-a1b2c3d4@heat.nz, customer@example.com
Reply-To: customer@example.com
```

### Quote Enquiry:
```
To: tradesperson@heat.nz
BCC: project-abc123def456@heat.nz, customer@example.com
Reply-To: customer@example.com
```

## Benefits

1. **Shared Inbox:** All project-related emails in one place
2. **Customer Access:** Customer can see all project communications
3. **Privacy:** BCC keeps email addresses hidden
4. **Organization:** Easy to filter/search by project email
5. **Transparency:** Customer has full visibility of project communications

## Testing

1. Submit a test contact form
2. Check Vercel logs for: `📧 Project temp email generated: project-xxx@yourdomain.com`
3. Check your email - you should see the BCC in the email headers
4. Check the project email inbox (if using a service)

## Troubleshooting

### BCC not working:
- Check `PROJECT_EMAIL_DOMAIN` is set in Vercel
- Check logs for: `⚠️ PROJECT_EMAIL_DOMAIN not configured`
- Redeploy after setting the variable

### Emails not arriving:
- Verify email forwarding is set up correctly
- Check spam folders
- Verify the domain accepts emails for that pattern

### Want to customize the email format:
- Edit the `projectTempEmail` generation in:
  - `pages/api/contact.js` (line ~248)
  - `pages/api/quote-enquiry.js` (line ~257)

## Advanced: Custom Email Format

If you want a different format, modify the code:

```javascript
// Current format
const projectTempEmail = `project-${leadId}@${process.env.PROJECT_EMAIL_DOMAIN}`;

// Custom format examples:
// Option 1: Include customer name
const projectTempEmail = `project-${leadId}-${customerName.toLowerCase().replace(/\s+/g, '-')}@${process.env.PROJECT_EMAIL_DOMAIN}`;

// Option 2: Use quote ID
const projectTempEmail = `quote-${quoteId}@${process.env.PROJECT_EMAIL_DOMAIN}`;

// Option 3: Date-based
const projectTempEmail = `project-${new Date().toISOString().split('T')[0]}-${leadId}@${process.env.PROJECT_EMAIL_DOMAIN}`;
```

