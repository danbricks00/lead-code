# Google Docs Quote Template Setup Guide

## ✅ Your Google Docs Template is Ready!

**Document ID:** `1jmcEgI6o8XS1KAgOyoWrx2xtuzU9v7y5`
**Template URL:** https://docs.google.com/document/d/1jmcEgI6o8XS1KAgOyoWrx2xtuzU9v7y5/edit

## Step 1: Update Your Template

Your Google Docs template should include these placeholders:

- `{{CUSTOMER_NAME}}` - Customer's full name
- `{{CUSTOMER_ADDRESS}}` - Customer's address from lead data
- `{{QUOTE_NUMBER}}` - Auto-generated quote number (e.g., QU1001, QU1002)
- `{{SERVICE_TYPE}}` - Service type from lead (underfloor_heating, etc.)
- `{{PROJECT_DETAILS}}` - Project details from lead
- `{{TOTAL_AMOUNT}}` - Total quote amount from tradesman
- `{{ITEM_BREAKDOWN}}` - Itemized breakdown from tradesman
- `{{TRADESMAN_NAME}}` - Tradesman/company name
- `{{TRADESMAN_PHONE}}` - Tradesman phone number
- `{{TRADESMAN_EMAIL}}` - Tradesman email
- `{{VALID_UNTIL}}` - Quote validity date
- `{{ADDITIONAL_NOTES}}` - Any additional notes from tradesman

## Step 2: Add Environment Variable

Add this to your Vercel environment variables:
```
GOOGLE_DOCS_TEMPLATE_ID=1jmcEgI6o8XS1KAgOyoWrx2xtuzU9v7y5
```

## Step 3: Quote Naming Convention

✅ **Final quote name format:** `Quote {quote number}`
- Example: `Quote QU1001`
- Example: `Quote QU1002`

## Step 4: Complete Workflow

### When a Lead Comes In:
1. **Customer completes chatbot** → Lead saved to Google Sheets
2. **Customer gets confirmation email** ✅
3. **Admin gets notification email** with all lead details ✅
4. **Admin creates quote** using your Google Docs template
5. **Admin fills in pricing** from tradesman submission
6. **Admin saves as PDF** with name "Quote {quote number}"
7. **Admin sends PDF quote** to customer

### When Tradesman Submits Quote:
1. **Tradesman fills out quote form** with pricing details
2. **Quote saved to Google Sheets** with all details
3. **Customer gets email** with quote summary and link to view full quote
4. **✅ AUTOMATIC: Google Docs document created** with filename "Quote {quote number}"
5. **Admin gets notification email** with link to the new Google Docs document
6. **Admin reviews and customizes** the generated document
7. **Admin saves as PDF** and sends to customer

### ✅ NEW: Automatic Document Creation
- **Every quote submission** automatically creates a new Google Docs document
- **Document name:** "Quote {quote number}" (e.g., "Quote QU1001")
- **Template copied** and filled with all quote data
- **Admin notified** with direct link to the new document
- **No manual work** required - everything is automated!

## Step 5: Template Example

Your template should look like this:

```
QUOTE

Quote Number: {{QUOTE_NUMBER}}
Date: {{DATE}}

TO: {{CUSTOMER_NAME}}
    {{CUSTOMER_ADDRESS}}

SERVICE: {{SERVICE_TYPE}}
PROJECT: {{PROJECT_DETAILS}}

ITEM BREAKDOWN:
{{ITEM_BREAKDOWN}}

TOTAL: ${{TOTAL_AMOUNT}}

Valid until: {{VALID_UNTIL}}

{{ADDITIONAL_NOTES}}

{{TRADESMAN_NAME}}
{{TRADESMAN_PHONE}}
{{TRADESMAN_EMAIL}}
```

## Benefits of This Approach

✅ **Simple and reliable** - No complex PDF generation
✅ **Professional templates** - Easy to customize in Google Docs
✅ **Consistent naming** - "Quote {quote number}" format
✅ **All pricing details** - Captured from tradesman submission
✅ **Works offline** - No technical dependencies
✅ **Easy to modify** - Update template anytime

## Next Steps

1. **Update your Google Docs template** with the placeholders above
2. **Add the environment variable** to Vercel
3. **Test the system** with a sample lead
4. **Create your first quote** using the template

The system is now ready to capture all pricing information from tradesmen and create professional quotes with your preferred naming format! 