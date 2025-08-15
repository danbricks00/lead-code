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
    console.log('🔍 Testing Google Sheets structure...');

    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      console.log('⚠️ Google Sheets credentials not found');
      return res.status(500).json({ error: 'Google Sheets not configured' });
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
    
    // Find the correct sheet to use (prefer 'Leads', fallback to 'Sheet1', then first sheet)
    let targetSheet = 'Sheet1'; // Default fallback
    if (availableSheets.includes('Leads')) {
      targetSheet = 'Leads';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }
    
    console.log('🎯 Using sheet for analysis:', targetSheet);

    // Read all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(200).json({
        message: 'No data found in spreadsheet',
        sheet: targetSheet,
        availableSheets: availableSheets
      });
    }

    // Analyze the structure
    const firstRow = rows[0];
    const secondRow = rows[1] || [];
    
    console.log('📋 First row (headers):', firstRow);
    console.log('📋 Second row (sample data):', secondRow);
    
    // Check if first row looks like headers
    const hasHeaders = firstRow.some(cell => 
      cell && typeof cell === 'string' && 
      (cell.toLowerCase().includes('timestamp') || 
       cell.toLowerCase().includes('customer') || 
       cell.toLowerCase().includes('service') || 
       cell.toLowerCase().includes('email') ||
       cell.toLowerCase().includes('phone'))
    );
    
    let headers, dataRows;
    
    if (hasHeaders) {
      headers = firstRow;
      dataRows = rows.slice(1);
      console.log('✅ Using existing headers');
    } else {
      headers = [];
      dataRows = rows;
      console.log('⚠️ No headers detected, treating first row as data');
    }
    
    // Find service column index
    let serviceIndex = -1;
    if (headers.length > 0) {
      serviceIndex = headers.findIndex(header => 
        header && typeof header === 'string' && 
        header.toLowerCase().includes('service')
      );
    }
    
    // Analyze data structure
    const analysis = {
      sheet: targetSheet,
      availableSheets: availableSheets,
      totalRows: rows.length,
      hasHeaders: hasHeaders,
      headers: headers,
      serviceColumnIndex: serviceIndex,
      serviceColumnName: serviceIndex >= 0 ? headers[serviceIndex] : 'Not found',
      sampleData: dataRows.slice(0, 3), // First 3 data rows
      columnCount: firstRow.length,
      timestampColumn: firstRow[0] || 'Column A',
      leadIdColumn: firstRow[1] || 'Column B',
      customerNameColumn: firstRow[2] || 'Column C',
      customerEmailColumn: firstRow[3] || 'Column D',
      customerPhoneColumn: firstRow[4] || 'Column E',
      selectedServiceColumn: firstRow[5] || 'Column F',
      projectDetailsColumn: firstRow[6] || 'Column G',
      projectSizeColumn: firstRow[7] || 'Column H',
      budgetColumn: firstRow[8] || 'Column I',
      timelineColumn: firstRow[9] || 'Column J',
      locationColumn: firstRow[10] || 'Column K',
      specificDetailsColumn: firstRow[11] || 'Column L',
      statusColumn: firstRow[14] || 'Column O'
    };

    console.log('📊 Analysis complete:', analysis);

    return res.status(200).json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('❌ Error analyzing sheets structure:', error);
    return res.status(500).json({
      error: 'Failed to analyze sheets structure',
      details: error.message
    });
  }
}
