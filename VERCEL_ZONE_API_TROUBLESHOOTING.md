# Vercel Zone API Troubleshooting Guide

## Issue Description
The "choose an area" dropdown in the chatbot is not populating on the Vercel deployment at:
`https://vercel.com/kiwi-trade/new-tradewebsite-code/DyNFvmsRzFV6eddz7fM1MdLqLHr6`

## Debug Steps

### 1. Test the Debug Page
Visit the debug page to identify the issue:
```
https://heat.nz/debug-zone-api.html
```

This page will:
- Test the `/api/get-zone-data` endpoint
- Show network request details
- Display any error messages
- Check environment variables (server-side)

### 2. Check Vercel Environment Variables
The most common cause is missing environment variables on Vercel. Ensure these are set in your Vercel dashboard:

**Required Environment Variables:**
```bash
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_CER_URL=your_client_cert_url
```

**How to set them:**
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the correct value
5. Redeploy the project

### 3. Check Vercel Function Logs
1. Go to your Vercel dashboard
2. Select your project
3. Go to Functions tab
4. Look for `/api/get-zone-data` function
5. Check the logs for any errors

### 4. Verify Google Sheets Access
Ensure your service account has access to the Google Sheet:
1. Open your Google Sheet
2. Click "Share" button
3. Add your service account email with "Editor" permissions
4. Make sure the "Zone" sheet exists in the spreadsheet

### 5. Test API Endpoint Directly
Try accessing the API directly in your browser:
```
https://heat.nz/api/get-zone-data
```

This should return JSON data or an error message.

## Common Issues and Solutions

### Issue 1: Environment Variables Not Set
**Symptoms:** API returns 500 error with "Google Sheets credentials not configured"
**Solution:** Add all required environment variables to Vercel

### Issue 2: Google Sheets Permission Denied
**Symptoms:** API returns 403 or 404 error
**Solution:** Share the Google Sheet with your service account email

### Issue 3: Zone Sheet Not Found
**Symptoms:** API returns "Zone sheet not found in the spreadsheet"
**Solution:** Ensure the sheet is named exactly "Zone" (case-sensitive)

### Issue 4: Column Headers Not Found
**Symptoms:** API returns "Zone sheet does not contain required Area and Suburb columns"
**Solution:** Ensure your Zone sheet has columns with headers containing "Area" and "Suburb"

### Issue 5: Network/Timeout Issues
**Symptoms:** Frontend shows network error or timeout
**Solution:** Check Vercel function timeout settings and Google Sheets API quotas

## Zone Sheet Structure Requirements

Your Zone sheet should have this structure:
```
| Suburb Column | Area Column | Postcode Column |
|---------------|-------------|-----------------|
| Ponsonby      | Auckland Central | 1011 |
| Takapuna      | North Shore | 0622 |
| Newmarket     | Auckland Central | 1023 |
```

**Column Headers:**
- Suburb column: Must contain "suburb", "location", or "city" in the header
- Area column: Must contain "area", "region", or "zone" in the header
- Postcode column: Must contain "postcode", "post code", or "zip" in the header

**Sheet Position:**
- The Zone sheet is the last sheet in your Google Sheets document
- Sheet order: Sheet1, Tradesmen, Quotes, Leads, Counter Quotes, Quote Decision, Zone

## Testing Locally vs Vercel

### Local Testing
```bash
# Test locally
npm run dev
# Visit http://localhost:3000/debug-zone-api.html
```

### Vercel Testing
```bash
# Deploy to Vercel
vercel --prod
# Visit https://heat.nz/debug-zone-api.html
```

## Enhanced Error Handling

The updated code now includes:
- Detailed console logging
- Better error messages
- Frontend error handling
- User-friendly error messages in chat

## Next Steps

1. **Immediate:** Use the debug page to identify the specific issue
2. **Environment:** Check and set all required environment variables on Vercel
3. **Permissions:** Verify Google Sheets access
4. **Structure:** Ensure Zone sheet has correct structure
5. **Deploy:** Redeploy after making changes

## Support

If the issue persists:
1. Check Vercel function logs
2. Test the API endpoint directly
3. Verify all environment variables are set correctly
4. Ensure Google Sheets permissions are correct
5. Contact support with specific error messages from the debug page
