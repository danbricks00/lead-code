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
    console.log('🧪 Testing quote submission to Google Sheets...');

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

    // Read current data to see structure
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
    console.log('📝 Current headers:', headers);

    // Create a test quote with the SAME structure as the actual submission
    const testQuoteId = `TEST-QUOTE-${Date.now()}`;
    const testLeadId = `TEST-LEAD-${Date.now()}`;

    const testValues = [
      [
        new Date().toISOString(), // Timestamp
        testQuoteId, // Quote ID
        testLeadId, // Lead ID
        'Test Customer', // Customer Name
        'test@example.com', // Customer Email
        '123456789', // Customer Phone
        'Test Tradesman', // Tradesman Name
        'tradesman@example.com', // Tradesman Email
        '987654321', // Tradesman Phone
        'underfloor_heating', // Service Type
        'Test project details', // Project Details
        '50m2', // Project Size
        'Test Location', // Location
        '$5000', // Budget
        '2 weeks', // Timeline
        'Test specific details', // Specific Details
        '5000', // Quote Amount
        '100', // Labour Rate
        '10', // Labour Hours
        '1000', // Labour Subtotal
        '50', // Material Rate
        '50', // Material SQM
        '2500', // Material Subtotal
        '500', // Installation Amount
        '500', // Installation Subtotal
        'Labour: $1000, Materials: $2500, Installation: $500', // Breakdown
        'Test notes', // Notes
        '2025-09-15', // Valid Until
        'Pending', // Status
        'https://example.com/quote', // Online Quote URL
        'https://example.com/accept', // Accept URL
        'https://example.com/decline' // Decline URL
      ]
    ];

    console.log('📊 Test quote data structure:');
    console.log('Number of columns:', testValues[0].length);
    testValues[0].forEach((value, index) => {
      console.log(`Column ${index}: ${value}`);
    });

    // Try to append the test quote
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: `${targetSheet}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: testValues }
      });

      console.log('✅ Test quote saved successfully');

      // Verify it was saved by reading again
      const verifyResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${targetSheet}!A:Z`,
      });

      const newRows = verifyResponse.data.values;
      const lastRow = newRows[newRows.length - 1];
      
      console.log('🔍 Last row in sheet:', lastRow);
      console.log('🔍 Quote ID in last row:', lastRow[1]);

      return res.status(200).json({
        success: true,
        message: 'Test quote submitted successfully',
        testQuoteId,
        testLeadId,
        targetSheet,
        currentHeaders: headers,
        dataColumns: testValues[0].length,
        lastRowQuoteId: lastRow[1],
        verification: lastRow[1] === testQuoteId ? 'PASSED' : 'FAILED'
      });

    } catch (appendError) {
      console.error('❌ Failed to save test quote:', appendError.message);
      return res.status(500).json({
        error: 'Failed to save test quote',
        details: appendError.message,
        targetSheet,
        currentHeaders: headers,
        dataColumns: testValues[0].length
      });
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    return res.status(500).json({
      error: 'Test failed',
      details: error.message
    });
  }
}
