import { getGoogleSheetsClient } from '../../lib/_googleSheetsClient.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log("🔍 Testing Google Sheets connectivity...");
    
    // Get Google Sheets client
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
    
    console.log("📊 Attempting to fetch first 5 rows from Leads!A1:D5");
    
    // Try to fetch first 5 rows from Leads tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Leads!A1:D5'
    });
    
    const rows = response.data.values || [];
    console.log(`✅ Successfully fetched ${rows.length} rows from Google Sheets`);
    
    return res.status(200).json({
      success: true,
      message: `Successfully connected to Google Sheets. Found ${rows.length} rows.`,
      rows: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Google Sheets test failed:", error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to connect to Google Sheets",
      timestamp: new Date().toISOString()
    });
  }
}
