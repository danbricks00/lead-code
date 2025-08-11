# Google Sheets Quote Template Setup

## 📋 Overview
This guide helps you set up the Google Sheets template for storing quote data from the quote system.

## 🔧 Setup Steps

### 1. Create Google Sheets Document
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Quote System Database"

### 2. Set Up Quote Sheet
Create a sheet named "Quotes" with the following columns:

| Column | Header | Description |
|--------|--------|-------------|
| A | Timestamp | When the quote was submitted |
| B | Quote ID | Unique identifier for the quote |
| C | Quote Number | Quote number (e.g., QU001) |
| D | Tradesman Name | Name of the tradesman/company |
| E | Tradesman Email | Email of the tradesman |
| F | Tradesman Phone | Phone number of the tradesman |
| G | Total Amount | Total quote amount |
| H | Item Breakdown | Detailed breakdown of costs |
| I | Valid Until | Quote validity date |
| J | Additional Notes | Any additional notes |
| K | Status | Quote status (submitted, accepted, declined) |

### 3. Set Up Lead Sheet
Create a sheet named "Leads" with the following columns:

| Column | Header | Description |
|--------|--------|-------------|
| A | Timestamp | When the lead was submitted |
| B | Customer Name | Name of the customer |
| C | Customer Email | Email of the customer |
| D | Customer Phone | Phone number of the customer |
| E | Service Type | Type of service requested |
| F | Project Details | Details about the project |
| G | Project Size | Size/scope of the project |
| H | Budget | Customer's budget range |
| I | Timeline | Project timeline |
| J | Location | Project location |
| K | Specific Details | Any specific requirements |
| L | Status | Lead status |

### 4. Get Spreadsheet ID
1. Open your Google Sheets document
2. Copy the URL from the address bar
3. The spreadsheet ID is the long string between `/d/` and `/edit`
   - Example: `https://docs.google.com/spreadsheets/d/1ABC123DEF456GHI789/edit`
   - Spreadsheet ID: `1ABC123DEF456GHI789`

### 5. Set Up Google Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create a Service Account
5. Download the JSON key file
6. Add the credentials to your environment variables

### 6. Environment Variables
Add these to your Vercel environment variables:

```
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key_from_json_file
```

### 7. Share Spreadsheet
1. Open your Google Sheets document
2. Click "Share" button
3. Add your service account email with "Editor" permissions
4. Make sure the service account can access the spreadsheet

## 📊 Sample Data Format

### Quotes Sheet Sample:
```
Timestamp | Quote ID | Quote Number | Tradesman Name | Tradesman Email | Tradesman Phone | Total Amount | Item Breakdown | Valid Until | Additional Notes | Status
2024-08-11T06:30:00Z | TEST-QUOTE-001 | QU001 | Test Tradesman | tradesman@test.com | 1234567890 | 5000 | Materials: $3000\nLabor: $1500\nInstallation: $500 | 2024-09-11 | Test quote | submitted
```

### Leads Sheet Sample:
```
Timestamp | Customer Name | Customer Email | Customer Phone | Service Type | Project Details | Project Size | Budget | Timeline | Location | Specific Details | Status
2024-08-11T06:00:00Z | John Smith | john@example.com | 0987654321 | Underfloor Heating | Bathroom heating installation | 100m2 | 5000-10000 | 1 month | Auckland | Need quick installation | new
```

## 🔍 Testing
1. Submit a test quote through the system
2. Check if data appears in the Google Sheets
3. Verify all columns are populated correctly
4. Test the view quote functionality

## 🛠️ Troubleshooting

### Common Issues:
1. **Permission Denied**: Make sure service account has editor access
2. **Invalid Spreadsheet ID**: Double-check the ID from the URL
3. **API Not Enabled**: Enable Google Sheets API in Google Cloud Console
4. **Invalid Credentials**: Check your environment variables

### Debug Steps:
1. Check Vercel logs for error messages
2. Verify environment variables are set correctly
3. Test API access manually
4. Check spreadsheet permissions

## 📈 Next Steps
Once the template is working:
1. Set up automated quote document creation
2. Add quote acceptance/decline tracking
3. Implement quote status updates
4. Add reporting and analytics

## 📞 Support
If you encounter issues:
1. Check the Vercel deployment logs
2. Verify all environment variables are set
3. Test the API endpoints individually
4. Contact support if needed
