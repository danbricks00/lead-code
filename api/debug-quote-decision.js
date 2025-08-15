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
    const { quoteId, leadId, action } = req.query;
    
    if (!quoteId || !leadId || !action) {
      return res.status(400).json({
        error: 'Missing required parameters',
        received: { quoteId, leadId, action }
      });
    }

    console.log('🔍 Debug quote decision:', { quoteId, leadId, action });

    // Check environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    const envCheck = {
      GOOGLE_CLIENT_EMAIL: !!serviceAccountEmail,
      GOOGLE_PRIVATE_KEY: !!privateKey,
      GOOGLE_SPREADSHEET_ID: !!spreadsheetId
    };

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return res.status(500).json({
        error: 'Missing Google Sheets credentials',
        envCheck
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

    // Get available sheets
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    console.log('📋 Available sheets:', availableSheets);

    // Find the correct sheet to use
    let targetSheet = 'Sheet1';
    if (availableSheets.includes('Quotes')) {
      targetSheet = 'Quotes';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }

    console.log('🎯 Using sheet:', targetSheet);

    // Read all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    console.log(`📊 Found ${rows ? rows.length : 0} rows in ${targetSheet}`);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        error: 'No data found in sheet',
        targetSheet,
        availableSheets
      });
    }

    // Show headers
    const headers = rows[0];
    console.log('📝 Headers:', headers);

    // Search for the quote
    const quoteIdIndex = 1; // Quote ID is the second column (B)
    let foundQuote = null;
    let foundRowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowQuoteId = row[quoteIdIndex];
      
      if (rowQuoteId === quoteId) {
        foundQuote = row;
        foundRowIndex = i;
        break;
      }
    }

    // Also search for the lead
    const leadIdIndex = 2; // Lead ID is the third column (C)
    let foundLead = null;
    let foundLeadRowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowLeadId = row[leadIdIndex];
      
      if (rowLeadId === leadId) {
        foundLead = row;
        foundLeadRowIndex = i;
        break;
      }
    }

    // Show sample data
    const sampleData = rows.slice(1, 4).map((row, index) => ({
      rowNumber: index + 2,
      quoteId: row[quoteIdIndex] || 'N/A',
      leadId: row[leadIdIndex] || 'N/A',
      customerName: row[3] || 'N/A',
      status: row[28] || 'N/A'
    }));

    const debugInfo = {
      searchCriteria: { quoteId, leadId, action },
      environment: envCheck,
      targetSheet,
      availableSheets,
      totalRows: rows.length,
      headers: headers,
      sampleData: sampleData,
      searchResults: {
        quoteFound: !!foundQuote,
        quoteRowIndex: foundRowIndex,
        quoteData: foundQuote ? {
          quoteId: foundQuote[quoteIdIndex],
          leadId: foundQuote[leadIdIndex],
          customerName: foundQuote[3],
          status: foundQuote[28] || 'Pending'
        } : null,
        leadFound: !!foundLead,
        leadRowIndex: foundLeadRowIndex
      }
    };

    console.log('🔍 Debug info:', debugInfo);

    return res.status(200).json(debugInfo);

  } catch (error) {
    console.error('❌ Debug error:', error);
    return res.status(500).json({
      error: 'Debug failed',
      details: error.message
    });
  }
}
