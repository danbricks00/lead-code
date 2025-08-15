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
    const { quoteId, leadId } = req.query;

    console.log('🔍 Debug quote lookup for:', { quoteId, leadId });

    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return res.status(500).json({
        error: 'Google Sheets credentials not found',
        missing: {
          GOOGLE_CLIENT_EMAIL: !serviceAccountEmail,
          GOOGLE_PRIVATE_KEY: !privateKey,
          GOOGLE_SPREADSHEET_ID: !spreadsheetId
        }
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
    console.log('📊 Available sheets:', availableSheets);
    
    // Find the correct sheet to use (prefer 'Quotes', fallback to 'Sheet1', then first sheet)
    let targetSheet = 'Sheet1'; // Default fallback
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
    if (!rows || rows.length === 0) {
      return res.status(200).json({
        error: 'No data found in sheet',
        sheet: targetSheet,
        availableSheets: availableSheets
      });
    }

    console.log(`📋 Found ${rows.length} rows in ${targetSheet}`);

    // Show headers (first row)
    const headers = rows[0];
    console.log('📝 Headers:', headers);

    // Search for the quote
    let foundQuote = null;
    let foundRowIndex = -1;
    const quoteIdIndex = 1; // Quote ID is the second column (B)

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowQuoteId = row[quoteIdIndex];
      
      console.log(`Row ${i}: Quote ID = "${rowQuoteId}", Looking for = "${quoteId}"`);
      
      if (rowQuoteId === quoteId) {
        foundQuote = row;
        foundRowIndex = i;
        break;
      }
    }

    // Show sample data (first few rows)
    const sampleData = rows.slice(1, Math.min(5, rows.length));

    const debugInfo = {
      searchCriteria: {
        quoteId: quoteId,
        leadId: leadId
      },
      sheetInfo: {
        targetSheet: targetSheet,
        availableSheets: availableSheets,
        totalRows: rows.length,
        headers: headers
      },
      searchResults: {
        found: !!foundQuote,
        foundRowIndex: foundRowIndex,
        quoteIdColumn: quoteIdIndex,
        searchedRows: rows.length - 1
      },
      sampleData: sampleData.map((row, index) => {
        const rowData = {};
        headers.forEach((header, colIndex) => {
          rowData[header] = row[colIndex] || '';
        });
        return {
          rowNumber: index + 2, // +2 because we start from row 2 and index starts at 0
          data: rowData
        };
      })
    };

    if (foundQuote) {
      debugInfo.foundQuote = {
        rowNumber: foundRowIndex + 1,
        data: foundQuote,
        mappedData: {
          timestamp: foundQuote[0] || '',
          quoteId: foundQuote[1] || '',
          leadId: foundQuote[2] || '',
          customerName: foundQuote[3] || '',
          customerEmail: foundQuote[4] || '',
          customerPhone: foundQuote[5] || '',
          tradesmanName: foundQuote[6] || '',
          tradesmanEmail: foundQuote[7] || '',
          tradesmanPhone: foundQuote[8] || '',
          serviceType: foundQuote[9] || '',
          projectDetails: foundQuote[10] || '',
          projectSize: foundQuote[11] || '',
          location: foundQuote[12] || '',
          budget: foundQuote[13] || '',
          timeline: foundQuote[14] || '',
          specificDetails: foundQuote[15] || '',
          quoteAmount: foundQuote[16] || '',
          labourRate: foundQuote[17] || '',
          labourHours: foundQuote[18] || '',
          labourSubtotal: foundQuote[19] || '',
          materialRate: foundQuote[20] || '',
          materialSQM: foundQuote[21] || '',
          materialSubtotal: foundQuote[22] || '',
          installationAmount: foundQuote[23] || '',
          installationSubtotal: foundQuote[24] || '',
          breakdown: foundQuote[25] || '',
          notes: foundQuote[26] || '',
          validUntil: foundQuote[27] || '',
          status: foundQuote[28] || 'Pending',
          onlineQuoteUrl: foundQuote[29] || '',
          acceptUrl: foundQuote[30] || '',
          declineUrl: foundQuote[31] || ''
        }
      };
    }

    return res.status(200).json({
      success: true,
      debug: debugInfo
    });

  } catch (error) {
    console.error('❌ Error in debug quote lookup:', error);
    return res.status(500).json({
      error: 'Failed to debug quote lookup',
      details: error.message
    });
  }
}
