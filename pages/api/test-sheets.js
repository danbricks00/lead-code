// pages/api/test-sheets.js - Debug endpoint for Google Sheets
import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';

export default async function handler(req, res) {
  console.log("✅ Loaded API test-sheets.js");

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed. Use GET method.`
    });
  }

  try {
    console.log("📊 Testing Google Sheets connection...");

    const sheetId = getSpreadsheetId();
    console.log("📊 Sheet ID:", sheetId || "NOT_SET");

    if (!sheetId) {
      return res.status(400).json({
        success: false,
        error: "Google Sheet ID not configured",
        sheetId: "NOT_SET"
      });
    }

    try {
      const sheets = getGoogleSheetsClient();
      console.log("✅ Google Sheets client created");

      // Try to read a small range to test connectivity
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Leads!A1:D5',
      });

      const rows = response.data.values || [];
      console.log(`✅ Successfully read ${rows.length} rows from Google Sheets`);

      return res.status(200).json({
        success: true,
        message: "Google Sheets connection successful",
        rowsCount: rows.length,
        sampleData: rows.slice(0, 3), // First 3 rows
        timestamp: new Date().toISOString()
      });

    } catch (sheetsError) {
      console.error("❌ Google Sheets test failed:", sheetsError.message);
      return res.status(500).json({
        success: false,
        error: "Google Sheets test failed",
        details: sheetsError.message,
        code: sheetsError.code,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Test sheets API error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Test sheets failed',
      message: error.message
    });
  }
}
