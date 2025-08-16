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
    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return res.status(500).json({
        error: 'Missing Google Sheets credentials',
        serviceAccountEmail: !!serviceAccountEmail,
        privateKey: !!privateKey,
        spreadsheetId: !!spreadsheetId
      });
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

    // Get spreadsheet metadata
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    // Get headers for each sheet
    const sheetsInfo = {};
    
    for (const sheetName of availableSheets) {
      try {
        const headersResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: spreadsheetId,
          range: `${sheetName}!A1:Z1`
        });
        
        const headers = headersResponse.data.values?.[0] || [];
        const rowCount = headersResponse.data.values?.length || 0;
        
        sheetsInfo[sheetName] = {
          headers: headers,
          rowCount: rowCount,
          columnCount: headers.length
        };
      } catch (error) {
        sheetsInfo[sheetName] = {
          error: error.message,
          headers: [],
          rowCount: 0,
          columnCount: 0
        };
      }
    }

    return res.status(200).json({
      success: true,
      spreadsheetId: spreadsheetId,
      availableSheets: availableSheets,
      sheetsInfo: sheetsInfo,
      hasQuotesSheet: availableSheets.includes('Quotes'),
      hasLeadsSheet: availableSheets.includes('Leads')
    });

  } catch (error) {
    console.error('❌ Debug sheets structure error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
