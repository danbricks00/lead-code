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
    const { quoteId, leadId, token } = req.query;

    if (!quoteId) {
      return res.status(400).json({ error: 'Quote ID is required' });
    }

    console.log('🔍 Fetching quote by ID:', quoteId);

    // Fetch quote data from Google Sheets
    const quoteData = await fetchQuoteData(quoteId);
    
    if (!quoteData) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    console.log('✅ Quote data found:', quoteData);

    return res.status(200).json({
      success: true,
      quote: quoteData
    });

  } catch (error) {
    console.error('❌ Error fetching quote:', error);
    return res.status(500).json({
      error: 'Failed to fetch quote',
      details: error.message
    });
  }
}

async function fetchQuoteData(quoteId) {
  try {
    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      console.log('⚠️ Google Sheets credentials not found');
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

    // Get available sheets to find the correct one to use
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    // Find the correct sheet to use (prefer 'Quotes', fallback to 'Sheet1', then first sheet)
    let targetSheet = 'Sheet1'; // Default fallback
    if (availableSheets.includes('Quotes')) {
      targetSheet = 'Quotes';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }

    // Read all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return null;
    }

    // Find the quoteId column (second column)
    const quoteIdIndex = 1; // Quote ID is the second column (B)

    // Search for the quote with matching quoteId
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowQuoteId = row[quoteIdIndex];
      
      if (rowQuoteId === quoteId) {
        // Found the quote, map it to the expected structure
        return {
          timestamp: row[0] || '', // Timestamp
          quoteId: row[1] || '', // Quote ID
          leadId: row[2] || '', // Lead ID
          customerName: row[3] || '', // Customer Name
          customerEmail: row[4] || '', // Customer Email
          customerPhone: row[5] || '', // Customer Phone
          tradesmanName: row[6] || '', // Tradesman Name
          tradesmanEmail: row[7] || '', // Tradesman Email
          tradesmanPhone: row[8] || '', // Tradesman Phone
          serviceType: row[9] || '', // Service Type
          projectDetails: row[10] || '', // Project Details
          projectSize: row[11] || '', // Project Size
          location: row[12] || '', // Location
          budget: row[13] || '', // Budget
          timeline: row[14] || '', // Timeline
          specificDetails: row[15] || '', // Specific Details
          quoteAmount: row[16] || '', // Quote Amount
          labourRate: row[17] || '', // Labour Rate
          labourHours: row[18] || '', // Labour Hours
          labourSubtotal: row[19] || '', // Labour Subtotal
          materialRate: row[20] || '', // Material Rate
          materialSQM: row[21] || '', // Material SQM
          materialSubtotal: row[22] || '', // Material Subtotal
          installationAmount: row[23] || '', // Installation Amount
          installationSubtotal: row[24] || '', // Installation Subtotal
          breakdown: row[25] || '', // Breakdown
          notes: row[26] || '', // Notes
          status: row[27] || 'Pending', // Status
          onlineQuoteUrl: row[28] || '', // Online Quote URL
          acceptUrl: row[29] || '', // Accept URL
          declineUrl: row[30] || '' // Decline URL
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching quote data:', error);
    return null;
  }
}
