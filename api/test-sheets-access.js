import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testing Google Sheets access...');
    
    // Log environment variables (without sensitive data)
    console.log('📋 Environment check:');
    console.log('- GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');
    console.log('- GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
    console.log('- GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? '✅ Set' : '❌ Missing');
    console.log('- GOOGLE_SPREADSHEET_ID:', process.env.GOOGLE_SPREADSHEET_ID ? '✅ Set' : '❌ Missing');
    
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      return res.status(500).json({
        error: 'Missing Google credentials',
        missing: {
          clientEmail: !process.env.GOOGLE_CLIENT_EMAIL,
          privateKey: !process.env.GOOGLE_PRIVATE_KEY,
          projectId: !process.env.GOOGLE_PROJECT_ID,
          spreadsheetId: !process.env.GOOGLE_SPREADSHEET_ID
        }
      });
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    console.log('🔐 Service account email:', process.env.GOOGLE_CLIENT_EMAIL);
    console.log('📊 Spreadsheet ID:', spreadsheetId);

    // Test 1: Try to read the spreadsheet metadata
    console.log('📖 Testing spreadsheet access...');
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    console.log('✅ Spreadsheet metadata retrieved:', {
      title: metadata.data.properties.title,
      sheets: metadata.data.sheets.map(s => s.properties.title)
    });

    // Get available sheet names
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    console.log('📋 Available sheets:', availableSheets);

    // Find the correct sheet to use (prefer 'Leads', fallback to 'Sheet1', then first sheet)
    let targetSheet = 'Sheet1'; // Default fallback
    if (availableSheets.includes('Leads')) {
      targetSheet = 'Leads';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }

    console.log('🎯 Using sheet:', targetSheet);

    // Test 2: Try to read from the target sheet
    console.log(`📋 Testing ${targetSheet} sheet read...`);
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`
    });

    console.log('✅ Sheet read successful');
    console.log(`📊 Current rows in ${targetSheet} sheet:`, readResponse.data.values?.length || 0);

    // Test 3: Try to write a test row
    console.log('✍️ Testing write access...');
    const testRow = [
      new Date().toISOString(),
      'TEST_CUSTOMER',
      'test@example.com',
      'TEST_PHONE',
      'TEST_SERVICE',
      'TEST_PROJECT',
      'TEST_SIZE',
      'TEST_LOCATION',
      'TEST_BUDGET',
      'TEST_TIMELINE',
      'TEST_DETAILS',
      'Sent',
      'Sent',
      'Test'
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [testRow] }
    });

    console.log('✅ Test row written successfully');

    return res.json({
      success: true,
      message: 'All Google Sheets tests passed!',
      serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL,
      spreadsheetTitle: metadata.data.properties.title,
      availableSheets: availableSheets,
      targetSheet: targetSheet,
      currentLeadsCount: readResponse.data.values?.length || 0,
      note: availableSheets.includes('Leads') ? 'Using Leads sheet' : `Using ${targetSheet} sheet (Leads sheet not found)`
    });

  } catch (error) {
    console.error('❌ Google Sheets test failed:', error.message);
    
    return res.status(500).json({
      error: 'Google Sheets test failed',
      message: error.message,
      serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL,
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      suggestion: 'Make sure the service account email has Editor access to the spreadsheet'
    });
  }
}
