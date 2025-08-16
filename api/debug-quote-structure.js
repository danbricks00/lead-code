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
    const { quoteId } = req.query;
    
    if (!quoteId) {
      return res.status(400).json({ error: 'Quote ID is required' });
    }

    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
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
      return res.status(404).json({ error: 'No data found in sheet' });
    }

    // Search for the quote across ALL columns in each row
    let foundRow = null;
    let foundRowIndex = -1;
    let foundColumnIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Search for the quoteId in ANY column of this row
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellValue = row[colIndex];
        if (cellValue === quoteId) {
          foundRow = row;
          foundRowIndex = i + 1; // +1 because sheets are 1-indexed
          foundColumnIndex = colIndex;
          break;
        }
      }
      
      if (foundRow) break;
    }

    if (!foundRow) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Get headers (first row)
    const headers = rows[0] || [];

    // Create detailed analysis
    const analysis = {
      quoteId: quoteId,
      foundRowIndex: foundRowIndex,
      foundColumnIndex: foundColumnIndex,
      foundColumnLetter: String.fromCharCode(65 + foundColumnIndex),
      sheetName: targetSheet,
      totalRows: rows.length,
      totalColumns: foundRow.length,
      headers: headers,
      rowData: foundRow,
      columnAnalysis: []
    };

    // Analyze each column in the found row
    for (let colIndex = 0; colIndex < foundRow.length; colIndex++) {
      const cellValue = foundRow[colIndex];
      const columnLetter = String.fromCharCode(65 + colIndex);
      const header = headers[colIndex] || `Column ${columnLetter}`;
      
      analysis.columnAnalysis.push({
        columnIndex: colIndex,
        columnLetter: columnLetter,
        header: header,
        value: cellValue,
        valueType: typeof cellValue,
        isQuoteId: cellValue === quoteId,
        isLeadId: cellValue && cellValue.startsWith('LEAD-'),
        isEmail: cellValue && cellValue.includes('@'),
        isPhone: cellValue && /^\d{7,15}$/.test(cellValue) && Number(cellValue) < 1000000000,
        isAmount: cellValue && /^\d+(\.\d{2})?$/.test(cellValue) && Number(cellValue) > 0 && Number(cellValue) < 1000000,
        isName: cellValue && /^[A-Za-z\s]+$/.test(cellValue) && cellValue.length > 2 && cellValue.length < 50
      });
    }

    // Find potential status column (usually near the end)
    const potentialStatusColumns = analysis.columnAnalysis.filter(col => 
      col.header.toLowerCase().includes('status') || 
      col.header.toLowerCase().includes('decision') ||
      col.header.toLowerCase().includes('state')
    );

    analysis.potentialStatusColumns = potentialStatusColumns;
    analysis.recommendedStatusColumn = potentialStatusColumns.length > 0 ? potentialStatusColumns[0] : null;

    res.status(200).json(analysis);

  } catch (error) {
    console.error('Error debugging quote structure:', error);
    res.status(500).json({ error: error.message });
  }
}
