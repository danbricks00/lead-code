import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('🔧 Setting up Quotes sheet...');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Initialize Google Auth
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      
      // Create Quotes sheet with headers
      const quotesHeaders = [
        'Timestamp',
        'Quote ID', 
        'Quote Number',
        'Tradesman Name',
        'Tradesman Email',
        'Tradesman Phone',
        'Total Amount',
        'Item Breakdown',
        'Valid Until',
        'Additional Notes',
        'Status'
      ];

      // First, try to create the Quotes sheet
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
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
        console.log('✅ Quotes sheet created');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('ℹ️ Quotes sheet already exists');
        } else {
          throw error;
        }
      }

      // Add headers to Quotes sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: 'Quotes!A1:K1',
        valueInputOption: 'RAW',
        resource: { values: [quotesHeaders] }
      });

      console.log('✅ Quotes sheet headers added');

      return res.status(200).json({
        success: true,
        message: 'Quotes sheet setup complete!',
        headers: quotesHeaders
      });

    } catch (error) {
      console.error('❌ Error setting up Quotes sheet:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to setup Quotes sheet',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
