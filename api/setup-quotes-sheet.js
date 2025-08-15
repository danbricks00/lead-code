import { google } from 'googleapis';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 Setting up Quotes sheet...');

    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      console.log('⚠️ Google Sheets credentials not found');
      return res.status(500).json({ error: 'Google Sheets credentials not found' });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: serviceAccountEmail,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get available sheets
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    console.log('📋 Available sheets:', availableSheets);

    // Check if Quotes sheet exists
    if (availableSheets.includes('Quotes')) {
      console.log('✅ Quotes sheet already exists');
      return res.status(200).json({ 
        success: true, 
        message: 'Quotes sheet already exists',
        availableSheets 
      });
    }

    // Create Quotes sheet
    console.log('📝 Creating Quotes sheet...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Quotes'
              }
            }
          }
        ]
      }
    });

    // Add headers to the Quotes sheet
    const headers = [
      'Timestamp',
      'Quote ID',
      'Lead ID',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Tradesman Name',
      'Tradesman Email',
      'Tradesman Phone',
      'Service Type',
      'Project Details',
      'Project Size',
      'Location',
      'Budget',
      'Timeline',
      'Specific Details',
      'Quote Amount',
      'Labour Rate',
      'Labour Hours',
      'Labour Subtotal',
      'Material Rate',
      'Material SQM',
      'Material Subtotal',
      'Installation Amount',
      'Installation Subtotal',
      'Breakdown',
      'Notes',
      'Status',
      'Online Quote URL',
      'Accept URL',
      'Decline URL'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Quotes!A1:AE1',
      valueInputOption: 'RAW',
      resource: { values: [headers] }
    });

    console.log('✅ Quotes sheet created successfully with headers');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Quotes sheet created successfully',
      availableSheets: [...availableSheets, 'Quotes']
    });

  } catch (error) {
    console.error('❌ Error setting up Quotes sheet:', error);
    return res.status(500).json({
      error: 'Failed to setup Quotes sheet',
      details: error.message
    });
  }
}
