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
    console.log('🧪 Test quote submission started');

    // Check environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    console.log('🔑 Environment check:', {
      hasServiceAccountEmail: !!serviceAccountEmail,
      hasPrivateKey: !!privateKey,
      hasSpreadsheetId: !!spreadsheetId,
      spreadsheetId: spreadsheetId
    });

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return res.status(500).json({
        error: 'Missing Google Sheets credentials',
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

    // Read existing data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    console.log(`📊 Found ${rows ? rows.length : 0} rows in ${targetSheet}`);

    if (rows && rows.length > 0) {
      console.log('📝 Headers:', rows[0]);
      console.log('📝 Sample data (first 3 rows):', rows.slice(1, 4));
    }

    // Test adding a sample quote
    const testQuoteId = `TEST-QUOTE-${Date.now()}`;
    const testQuoteData = [
      [
        new Date().toISOString(), // Timestamp
        testQuoteId, // Quote ID
        'TEST-LEAD-123', // Lead ID
        'Test Customer', // Customer Name
        'test@example.com', // Customer Email
        '021 123 456', // Customer Phone
        'Test Tradesman', // Tradesman Name
        'tradesman@example.com', // Tradesman Email
        '021 654 321', // Tradesman Phone
        'Underfloor Heating', // Service Type
        'Test project details', // Project Details
        '25', // Project Size
        'Auckland', // Location
        '5000', // Budget
        '2 weeks', // Timeline
        'Test specific details', // Specific Details
        '5000.00', // Quote Amount
        '50.00', // Labour Rate
        '8', // Labour Hours
        '400.00', // Labour Subtotal
        '120.00', // Material Rate
        '25', // Material SQM
        '3000.00', // Material Subtotal
        '500.00', // Installation Amount
        '500.00', // Installation Subtotal
        'Labour: $400, Materials: $3000, Installation: $500', // Breakdown
        'Test notes', // Notes
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Valid Until
        'Pending', // Status
        'https://example.com/quote', // Online Quote URL
        'https://example.com/accept', // Accept URL
        'https://example.com/decline' // Decline URL
      ]
    ];

    console.log('📊 Test quote data prepared:', {
      quoteId: testQuoteId,
      dataLength: testQuoteData[0].length,
      columns: testQuoteData[0].length
    });

    // Try to append the test quote
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: `${targetSheet}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: testQuoteData }
      });

      console.log('✅ Test quote saved successfully');

      // Verify it was saved by reading again
      const verifyResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${targetSheet}!A:Z`,
      });

      const verifyRows = verifyResponse.data.values;
      const savedQuote = verifyRows ? verifyRows.find(row => row[1] === testQuoteId) : null;

      return res.status(200).json({
        success: true,
        message: 'Test quote submission successful',
        testQuoteId: testQuoteId,
        targetSheet: targetSheet,
        availableSheets: availableSheets,
        totalRows: verifyRows ? verifyRows.length : 0,
        savedQuoteFound: !!savedQuote,
        savedQuoteData: savedQuote ? {
          quoteId: savedQuote[1],
          customerName: savedQuote[3],
          quoteAmount: savedQuote[16],
          validUntil: savedQuote[27]
        } : null
      });

    } catch (appendError) {
      console.error('❌ Error appending test quote:', appendError);
      return res.status(500).json({
        error: 'Failed to append test quote',
        details: appendError.message
      });
    }

  } catch (error) {
    console.error('❌ Test quote submission error:', error);
    return res.status(500).json({
      error: 'Test quote submission failed',
      details: error.message
    });
  }
}
