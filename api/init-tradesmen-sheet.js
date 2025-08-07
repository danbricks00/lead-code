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
    console.log('🔧 Initializing Tradesmen sheet...');

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      console.log('❌ No spreadsheet ID configured');
      return res.status(500).json({
        success: false,
        error: 'Google Sheets not configured'
      });
    }

    // Check if Tradesmen sheet exists
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: 'Tradesmen!A1'
      });
      console.log('✅ Tradesmen sheet already exists');
      return res.json({
        success: true,
        message: 'Tradesmen sheet already exists'
      });
    } catch (error) {
      console.log('📝 Creating Tradesmen sheet...');
      
      // Create the Tradesmen sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'Tradesmen'
              }
            }
          }]
        }
      });
      
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Tradesmen!A1:H1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Email', 'Name', 'TradeType', 'BusinessName', 'Phone', 'Location', 'Status', 'CreatedAt']]
        }
      });
      
      console.log('✅ Tradesmen sheet created successfully');
      return res.json({
        success: true,
        message: 'Tradesmen sheet created successfully'
      });
    }

  } catch (error) {
    console.error('❌ Error initializing Tradesmen sheet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize Tradesmen sheet',
      details: error.message
    });
  }
} 