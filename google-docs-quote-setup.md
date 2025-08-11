# Google Docs Quote Template Setup Guide

## 📋 Required Environment Variable

You need to add this environment variable to your Vercel project:

```
GOOGLE_DOCS_TEMPLATE_ID = [Your Google Docs Template ID]
```

## 🔧 How to Get Your Template ID

1. **Create a Google Docs template:**
   - Go to [Google Docs](https://docs.google.com)
   - Create a new document
   - Design your quote template with placeholders
   - Save it as "Quote Template"

2. **Get the Template ID:**
   - Open your template document
   - Look at the URL: `https://docs.google.com/document/d/[TEMPLATE_ID]/edit`
   - Copy the `[TEMPLATE_ID]` part (it's a long string of letters and numbers)

3. **Add to Vercel:**
   - Go to your Vercel project dashboard
   - Go to Settings → Environment Variables
   - Add: `GOOGLE_DOCS_TEMPLATE_ID` = your template ID

## 📝 Required Placeholders

Your Google Docs template must include these exact placeholders (case-sensitive):

### Quote Details
- `{{QUOTE_NUMBER}}` - The quote number
- `{{DATE}}` - Current date
- `{{VALID_UNTIL}}` - Quote validity date

### Customer Information
- `{{CUSTOMER_NAME}}` - Customer's full name
- `{{CUSTOMER_EMAIL}}` - Customer's email address
- `{{CUSTOMER_PHONE}}` - Customer's phone number
- `{{CUSTOMER_ADDRESS}}` - Customer's location/address

### Tradesman Information
- `{{TRADESMAN_NAME}}` - Tradesman/company name
- `{{TRADESMAN_EMAIL}}` - Tradesman's email
- `{{TRADESMAN_PHONE}}` - Tradesman's phone number

### Quote Content
- `{{ITEM_BREAKDOWN}}` - Detailed breakdown of items and costs
- `{{TOTAL_AMOUNT}}` - Total quote amount
- `{{ADDITIONAL_NOTES}}` - Any additional notes or terms

## 📄 Example Template Structure

Here's an example of how your template might look:

```
QUOTE

Quote Number: {{QUOTE_NUMBER}}
Date: {{DATE}}
Valid Until: {{VALID_UNTIL}}

CUSTOMER DETAILS
Name: {{CUSTOMER_NAME}}
Email: {{CUSTOMER_EMAIL}}
Phone: {{CUSTOMER_PHONE}}
Address: {{CUSTOMER_ADDRESS}}

TRADESMAN DETAILS
Company: {{TRADESMAN_NAME}}
Email: {{TRADESMAN_EMAIL}}
Phone: {{TRADESMAN_PHONE}}

QUOTE BREAKDOWN
{{ITEM_BREAKDOWN}}

TOTAL AMOUNT: ${{TOTAL_AMOUNT}}

ADDITIONAL NOTES
{{ADDITIONAL_NOTES}}
```

## ✅ Testing the Template

1. **Set up your template** with the placeholders above
2. **Add the environment variable** to Vercel
3. **Test the workflow** using the test page
4. **Check the generated PDF** to ensure all placeholders are replaced

## 🔍 Troubleshooting

- **Placeholders not replaced:** Make sure the placeholder text matches exactly (case-sensitive)
- **Template not found:** Verify the `GOOGLE_DOCS_TEMPLATE_ID` is correct
- **PDF not generated:** Check that your service account has access to the template
- **Data mismatch:** Ensure the quote form is passing the correct data to the PDF generation

## 📧 What Happens Next

When a quote is submitted:
1. **Template is copied** to create a new document
2. **Placeholders are replaced** with actual data
3. **Document is exported** as PDF
4. **PDF is emailed** to customer, tradesman, and admin
5. **New document is saved** with the quote number as the filename 