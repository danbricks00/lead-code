import { google } from 'googleapis';
import { sendStep1Emails } from './gmail-api-helper.js';

export default async function handler(req, res) {
  console.log('📧 Lead notification API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const leadData = req.body;
      console.log('✅ Lead data received:', leadData);

      // Generate unique lead ID
      const leadId = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get current URL for quote links
      const currentUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      // Create quote submission link with pre-filled data
      const quoteLink = `${currentUrl}/api/quote-submission?leadId=${leadId}&customerName=${encodeURIComponent(leadData.customerName)}&customerEmail=${encodeURIComponent(leadData.customerEmail)}&customerPhone=${encodeURIComponent(leadData.customerPhone)}&serviceType=${encodeURIComponent(leadData.selectedService)}&projectDetails=${encodeURIComponent(leadData.projectDetails)}&projectSize=${encodeURIComponent(leadData.projectSize)}&budget=${encodeURIComponent(leadData.budget)}&timeline=${encodeURIComponent(leadData.timeline)}&location=${encodeURIComponent(leadData.location)}`;

      // Prepare lead data for Step 1 email flow
      const step1LeadData = {
        customerName: leadData.customerName,
        customerEmail: leadData.customerEmail,
        customerPhone: leadData.customerPhone,
        serviceType: leadData.selectedService,
        projectDetails: leadData.projectDetails,
        projectSize: leadData.projectSize,
        budget: leadData.budget,
        timeline: leadData.timeline,
        location: leadData.location,
        quoteLink: quoteLink
      };

      console.log('📧 Preparing Step 1 email flow with data:', JSON.stringify(step1LeadData, null, 2));

      // Send Step 1 emails using the new function
      const emailResult = await sendStep1Emails(step1LeadData);

      // Save lead to Google Sheets with notification status
      let sheetsUpdated = false;
      if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          });

          const sheets = google.sheets({ version: 'v4', auth });
          
          const values = [
            [
              new Date().toISOString(),
              leadData.customerName,
              leadData.customerEmail,
              leadData.customerPhone,
              leadData.selectedService,
              leadData.projectDetails,
              leadData.projectSize,
              leadData.budget,
              leadData.timeline,
              leadData.location,
              leadData.specificDetails || '',
              'new',
              leadId,
              `Tradesman: ${emailResult.emailResults.tradesman.sent ? 'Sent' : 'Failed'}, Admin: ${emailResult.emailResults.admin.sent ? 'Sent' : 'Failed'}, Customer: ${emailResult.emailResults.customer.sent ? 'Sent' : 'Failed'}`,
              leadData.Rooms || '', // Structured room data
              leadData.totalSqm || '' // Total square meters
            ]
          ];

          await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Leads!A:L',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
          });

          console.log('✅ Lead saved to Google Sheets');
          sheetsUpdated = true;
        } catch (sheetsError) {
          console.error('❌ Google Sheets error:', sheetsError.message);
        }
      }

      // Return success response
      const response = {
        success: emailResult.success,
        message: emailResult.success ? 'Lead notification sent successfully!' : 'Lead notification partially sent',
        data: {
          leadId,
          customerName: leadData.customerName,
          serviceType: leadData.selectedService,
          location: leadData.location
        },
        status: {
          emailResults: emailResult.emailResults,
          emailSuccessRate: emailResult.emailSuccessRate,
          sheetsUpdated
        }
      };

      console.log('📊 Lead Notification Response:', response);
      return res.json(response);

    } catch (error) {
      console.error('❌ Error processing lead notification:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process lead notification',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
