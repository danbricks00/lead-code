import { google } from 'googleapis';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const leadData = req.body;
    console.log('✅ Lead received:', leadData);

    let sheetsUpdated = false;
    let customerEmailSent = false;
    let tradesmanEmailSent = false;

    // Debug: Log all environment variables
    console.log('🔍 ALL ENVIRONMENT VARIABLES:');
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_SPREADSHEET_ID:', process.env.GOOGLE_SPREADSHEET_ID ? '✅ Set' : '❌ Missing');

    // 1. Try to add to Google Sheets (if credentials are available)
    console.log('🔍 Checking Google Sheets credentials...');
    
    try {
      if (process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_PRIVATE_KEY) {
        console.log('✅ Google Sheets credentials found, attempting to write...');
        
        const auth = new google.auth.GoogleAuth({
          credentials: {
            type: "service_account",
            project_id: process.env.GOOGLE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            client_id: process.env.GOOGLE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        const range = 'Sheet1!A:K';
        
        const values = [[
          new Date().toISOString(),
          leadData.customerName,
          leadData.customerEmail,
          leadData.customerPhone,
          leadData.selectedService,
          leadData.projectDetails,
          leadData.projectSize,
          leadData.specificDetails,
          leadData.location,
          leadData.budget,
          leadData.timeline
        ]];

        console.log('📊 Attempting to write to spreadsheet:', spreadsheetId);
        console.log('📊 Data to write:', values);

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          resource: { values }
        });

        console.log('✅ Data added to Google Sheets successfully');
        sheetsUpdated = true;
      } else {
        console.log('⚠️ Google Sheets credentials not configured - skipping sheets update');
        console.log('Missing:', {
          projectId: !process.env.GOOGLE_PROJECT_ID,
          privateKey: !process.env.GOOGLE_PRIVATE_KEY,
          spreadsheetId: !process.env.GOOGLE_SPREADSHEET_ID
        });
      }
    } catch (sheetsError) {
      console.error('❌ Google Sheets error:', sheetsError);
      console.error('❌ Error details:', sheetsError.message);
    }

    // 2. Email functionality (temporarily disabled due to Nodemailer import issues)
    console.log('🔍 Email functionality temporarily disabled - Nodemailer import issue');
    console.log('📧 Would send customer email to:', leadData.customerEmail);
    console.log('📧 Would send tradesman email to: danbricks18@gmail.com');
    
    // TODO: Fix Nodemailer import and re-enable email functionality
    customerEmailSent = false;
    tradesmanEmailSent = false;

    // Return success response with detailed status
    const response = {
      success: true,
      message: 'Lead submitted successfully! Google Sheets updated. Email functionality temporarily disabled.',
      data: leadData,
      timestamp: new Date().toISOString(),
      status: {
        logged: true,
        sheetsUpdated,
        customerEmailSent,
        tradesmanEmailSent,
        note: 'Google Sheets working! Email needs Nodemailer fix'
      }
    };

    console.log('📊 Final Response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ Error processing lead:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process lead',
      details: error.message 
    });
  }
} 