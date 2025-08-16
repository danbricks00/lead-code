import { google } from 'googleapis';
import { fetchQuoteData, checkQuoteDecisionState } from './quote-utils.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { quoteId, leadId } = req.query;
    
    if (!quoteId) {
      return res.status(400).json({ error: 'Quote ID is required' });
    }

    console.log('🔍 Debug quote status for:', { quoteId, leadId });

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

    // Read all data to find the row with the matching quoteId
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No data found in sheet' });
    }

    // Find the row with the matching quoteId by searching all columns
    let targetRow = -1;
    let foundRow = null;
    let foundColumn = -1;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Search for the quoteId in ANY column of this row
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellValue = row[colIndex];
        if (cellValue === quoteId) {
          targetRow = i + 1; // +1 because sheets are 1-indexed
          foundRow = row;
          foundColumn = colIndex;
          break;
        }
      }
      
      if (targetRow !== -1) break;
    }

    if (targetRow === -1) {
      return res.status(404).json({ error: `Quote ID ${quoteId} not found in sheet` });
    }

    // Get the status column (column 29 - AC)
    const statusColumn = 28; // 0-indexed for column AC
    const status = foundRow[statusColumn] || 'Pending';

    // Use the unified function to check decision state
    const decisionState = await checkQuoteDecisionState(quoteId, leadId);

    // Get quote data using the unified function
    const quoteData = await fetchQuoteData(quoteId);

    const debugInfo = {
      quoteId: quoteId,
      leadId: leadId,
      targetSheet: targetSheet,
      targetRow: targetRow,
      foundColumn: foundColumn,
      statusColumn: statusColumn,
      rawStatus: status,
      decisionState: decisionState,
      quoteData: quoteData ? {
        quoteId: quoteData.quoteId,
        leadId: quoteData.leadId,
        customerName: quoteData.customerName,
        status: quoteData.status,
        quoteAmount: quoteData.quoteAmount
      } : null,
      fullRow: foundRow,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      debug: debugInfo,
      message: 'Use this data to debug quote status issues'
    });

  } catch (error) {
    console.error('❌ Debug quote status error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
