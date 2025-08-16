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
    const { quoteId, status } = req.query;
    
    if (!quoteId || !status) {
      return res.status(400).json({ error: 'Quote ID and status are required' });
    }

    console.log('🧪 Testing status update for:', { quoteId, status });

    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return res.status(500).json({
        error: 'Missing Google Sheets credentials'
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
    
    // Find the correct sheet
    let targetSheet = 'Sheet1';
    if (availableSheets.includes('Quotes')) {
      targetSheet = 'Quotes';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }

    console.log('📋 Using sheet:', targetSheet);

    // Read all data to find the row with the matching quoteId
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No data found in sheet' });
    }

    // Find the row with the matching quoteId
    let targetRow = -1;
    let foundRow = null;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Search for the quoteId in ANY column of this row
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellValue = row[colIndex];
        if (cellValue === quoteId) {
          targetRow = i + 1; // +1 because sheets are 1-indexed
          foundRow = row;
          break;
        }
      }
      
      if (targetRow !== -1) break;
    }

    if (targetRow === -1) {
      return res.status(404).json({ error: `Quote ID ${quoteId} not found in sheet` });
    }

    console.log('📋 Found quote at row:', targetRow);

    // Convert column number to letter (29 = AC)
    function columnToLetter(column) {
      let result = '';
      while (column > 0) {
        column--;
        result = String.fromCharCode(65 + (column % 26)) + result;
        column = Math.floor(column / 26);
      }
      return result;
    }

    const statusColumn = 29; // Column AC
    const statusColumnLetter = columnToLetter(statusColumn);
    const range = `${targetSheet}!${statusColumnLetter}${targetRow}`;

    console.log('📋 Updating range:', range, 'with status:', status);

    // Update the status
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[status]]
      }
    });

    console.log('✅ Status update response:', updateResponse.data);

    // Read back the status to verify
    const verifyResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });

    const updatedStatus = verifyResponse.data.values?.[0]?.[0] || 'Not found';

    return res.status(200).json({
      success: true,
      quoteId: quoteId,
      targetSheet: targetSheet,
      targetRow: targetRow,
      statusColumn: statusColumn,
      statusColumnLetter: statusColumnLetter,
      range: range,
      requestedStatus: status,
      updatedStatus: updatedStatus,
      updateResponse: updateResponse.data,
      message: `Status updated to: ${updatedStatus}`
    });

  } catch (error) {
    console.error('❌ Test status update error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
