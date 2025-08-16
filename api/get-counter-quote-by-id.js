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
    const { counterQuoteId, originalQuoteId, leadId, token } = req.query;
    
    if (!counterQuoteId) {
      return res.status(400).json({ error: 'Counter Quote ID is required' });
    }

    console.log('🔍 Fetching counter quote data for:', counterQuoteId);

    const counterQuoteData = await fetchCounterQuoteData(counterQuoteId);
    
    if (!counterQuoteData) {
      return res.status(404).json({ error: 'Counter quote not found' });
    }

    res.status(200).json({
      success: true,
      counterQuote: counterQuoteData
    });

  } catch (error) {
    console.error('❌ Error fetching counter quote:', error);
    res.status(500).json({
      error: 'Failed to fetch counter quote',
      details: error.message
    });
  }
}

async function fetchCounterQuoteData(counterQuoteId) {
  try {
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return null;
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

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    let targetSheet = 'Counter Quotes';
    if (!availableSheets.includes('Counter Quotes')) {
      return null;
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return null;
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowCounterQuoteId = row[1]; // Counter Quote ID is in column B
      
      if (rowCounterQuoteId === counterQuoteId) {
        return {
          timestamp: row[0] || '',
          counterQuoteId: row[1] || '',
          originalQuoteId: row[2] || '',
          leadId: row[3] || '',
          tradesmanName: row[4] || '',
          tradesmanEmail: row[5] || '',
          tradesmanPhone: row[6] || '',
          counterQuoteAmount: row[7] || '',
          labourRate: row[8] || '',
          labourHours: row[9] || '',
          labourSubtotal: row[10] || '',
          materialRate: row[11] || '',
          materialSQM: row[12] || '',
          materialSubtotal: row[13] || '',
          installationAmount: row[14] || '',
          installationSubtotal: row[15] || '',
          breakdown: row[16] || '',
          notes: row[17] || '',
          validUntil: row[18] || '',
          reasonForCounter: row[19] || '',
          status: row[20] || 'Pending'
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching counter quote data:', error);
    return null;
  }
}
