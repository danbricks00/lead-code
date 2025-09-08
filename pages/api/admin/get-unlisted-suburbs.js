// pages/api/admin/get-unlisted-suburbs.js - Fetch unlisted suburbs for admin interface
import { getGoogleSheetsClient, getSpreadsheetId } from '../../../lib/googleSheets.js';

export default async function handler(req, res) {
  console.log("✅ Loaded API admin/get-unlisted-suburbs.js");
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed. Use GET method.` 
    });
  }

  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    if (!spreadsheetId) {
      return res.status(500).json({
        success: false,
        error: 'Google Sheets not configured'
      });
    }

    console.log("📊 Fetching unlisted suburbs from Google Sheets...");
    
    // Try to get data from UnlistedSuburbs sheet
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'UnlistedSuburbs!A:P',
      });

      const rows = response.data.values || [];
      
      if (rows.length <= 1) {
        // No data or only header row
        return res.status(200).json({
          success: true,
          suburbs: [],
          message: 'No unlisted suburbs found'
        });
      }

      // Skip header row and map data
      const suburbs = rows.slice(1).map(row => ({
        timestamp: row[0] || '',
        leadId: row[1] || '',
        suburbName: row[2] || '',
        additionalInfo: row[3] || '',
        customerName: row[4] || '',
        customerEmail: row[5] || '',
        customerPhone: row[6] || '',
        serviceType: row[7] || 'Underfloor Heating',
        area: row[8] || '',
        budget: row[9] || '',
        timeline: row[10] || '',
        rooms: row[11] || '',
        status: row[12] || 'Pending Review',
        adminNotes: row[13] || '',
        decision: row[14] || '',
        decisionTimestamp: row[15] || ''
      }));

      console.log(`✅ Found ${suburbs.length} unlisted suburbs`);

      return res.status(200).json({
        success: true,
        suburbs: suburbs,
        count: suburbs.length
      });

    } catch (sheetsError) {
      console.error("❌ Failed to fetch from UnlistedSuburbs sheet:", sheetsError.message);
      
      // Return empty array if sheet doesn't exist yet
      return res.status(200).json({
        success: true,
        suburbs: [],
        message: 'UnlistedSuburbs sheet not found or empty'
      });
    }

  } catch (error) {
    console.error('❌ Get unlisted suburbs API error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
