# Heat.nz Deployment Checklist

## Environment Variables Setup

### Required Environment Variables for Production
```bash
# Base URL Configuration
NEXT_PUBLIC_BASE_URL=https://heat.nz
BASE_URL=https://heat.nz

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://heat.nz/api/auth/callback/google

# Google Sheets Configuration
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
USER_SHEET_ID=your_users_sheet_id_here

# Authentication Control Variables
ALLOW_GOOGLE_AUTH=true
NEXT_PUBLIC_ALLOW_GOOGLE_AUTH=true

# Quote System Configuration
QUOTE_LINK_SECRET=heat-nz-quote-security-secret-2024
ADMIN_EMAIL=admin@heat.nz

# Gmail Configuration
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# PDF Generation Services (Optional)
ADOBE_PDF_CLIENT_ID=your_adobe_client_id_here
ADOBE_PDF_CLIENT_SECRET=your_adobe_client_secret_here
ADOBE_PDF_ORGANIZATION_ID=your_organization_id_here
PDFSHIFT_API_KEY=your_pdfshift_api_key_here
API2PDF_API_KEY=your_api2pdf_api_key_here
```

## Pre-Deployment Checklist

### 1. Google Cloud Console Setup
- [ ] Update OAuth 2.0 Client ID authorized origins to include `https://heat.nz`
- [ ] Update OAuth 2.0 Client ID authorized redirect URIs to include `https://heat.nz/api/auth/callback/google`
- [ ] Verify Google Sheets API is enabled
- [ ] Ensure service account has access to all required Google Sheets

### 2. Domain Configuration
- [ ] Verify `heat.nz` domain is properly configured in Vercel
- [ ] Ensure SSL certificate is active
- [ ] Test domain accessibility

### 3. Environment Variables
- [ ] Set all required environment variables in Vercel dashboard
- [ ] Verify `NEXT_PUBLIC_BASE_URL=https://heat.nz` is set
- [ ] Test environment variables using `/api/test-env` endpoint

### 4. Code Verification
- [ ] All hardcoded URLs replaced with environment variables
- [ ] Test files updated to use relative URLs
- [ ] Customer decision buttons use correct API endpoints
- [ ] Build passes without errors

## Post-Deployment Testing

### 1. Basic Functionality
- [ ] Homepage loads correctly at `https://heat.nz`
- [ ] Chatbot loads and functions properly
- [ ] Contact form submission works
- [ ] Quote generation works end-to-end

### 2. Authentication
- [ ] Google OAuth login works
- [ ] Admin login functions correctly
- [ ] Session management works properly

### 3. Email Functionality
- [ ] Customer quote emails are sent
- [ ] Admin notification emails work
- [ ] Customer accept/decline buttons work
- [ ] Email links point to correct `heat.nz` URLs

### 4. API Endpoints
- [ ] All API endpoints respond correctly
- [ ] Quote submission works
- [ ] Customer decision endpoints function
- [ ] PDF generation works (if configured)

### 5. Mobile Responsiveness
- [ ] Chatbot works on mobile devices
- [ ] All forms are mobile-friendly
- [ ] Touch interactions work properly

## Troubleshooting

### Common Issues
1. **Environment Variables Not Loading**
   - Check Vercel dashboard for correct variable names
   - Ensure `NEXT_PUBLIC_` prefix for client-side variables
   - Redeploy after adding new variables

2. **OAuth Errors**
   - Verify Google Cloud Console settings
   - Check redirect URI matches exactly
   - Ensure OAuth consent screen is configured

3. **Email Issues**
   - Verify Gmail app password is correct
   - Check Gmail API settings
   - Test email sending with `/api/test-email`

4. **Quote System Issues**
   - Verify Google Sheets access
   - Check spreadsheet IDs are correct
   - Test quote generation workflow

## Support
For issues or questions, contact: admin@heat.nz
