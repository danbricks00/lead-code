// pages/api/zone.js - Zone lookup API with Google Sheets fallback
import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';

export default async function handler(req, res) {
  console.log("✅ Loaded API zone.js");
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed. Use GET method.` 
    });
  }

  try {
    const { suburb, area } = req.query;
    
    if (!suburb && !area) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: suburb or area'
      });
    }

    console.log("🔍 Zone lookup request:", { suburb, area });

    // Try Google Sheets first
    try {
      const sheets = getGoogleSheetsClient();
      const sheetId = getSpreadsheetId();
      
      if (sheetId) {
        console.log("📊 Attempting Google Sheets zone lookup...");
        
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'Zones!A:Z',
        });

        const rows = response.data.values || [];
        console.log(`📊 Found ${rows.length} zones in Google Sheets`);

        // Filter zones based on query
        const filteredZones = rows.filter(row => {
          const rowSuburb = row[0] || '';
          const rowArea = row[1] || '';
          const rowZone = row[2] || '';
          
          if (suburb && rowSuburb.toLowerCase().includes(suburb.toLowerCase())) {
            return true;
          }
          if (area && rowArea.toLowerCase().includes(area.toLowerCase())) {
            return true;
          }
          return false;
        });

        if (filteredZones.length > 0) {
          const zones = filteredZones.map(row => ({
            suburb: row[0] || '',
            area: row[1] || '',
            zone: row[2] || ''
          }));

          console.log(`✅ Found ${zones.length} matching zones in Google Sheets`);
          return res.status(200).json({
            success: true,
            rows: zones,
            source: 'google-sheets'
          });
        }
      }
    } catch (sheetsError) {
      console.error("❌ Google Sheets zone lookup failed:", sheetsError.message);
    }

    // Fallback to static JSON
    console.log("📄 Using zone fallback JSON...");
    try {
      const zoneFallback = await import('../../../data/zones (2).json');
      const zones = zoneFallback.default || zoneFallback;
      
      // Filter zones based on query
      const filteredZones = zones.filter(zone => {
        if (suburb && zone.suburb.toLowerCase().includes(suburb.toLowerCase())) {
          return true;
        }
        if (area && zone.area.toLowerCase().includes(area.toLowerCase())) {
          return true;
        }
        return false;
      });

      console.log(`✅ Found ${filteredZones.length} matching zones in fallback JSON`);
      return res.status(200).json({
        success: true,
        fallback: true,
        rows: filteredZones,
        source: 'fallback-json'
      });
    } catch (fallbackError) {
      console.error("❌ Zone fallback JSON failed:", fallbackError.message);
      return res.status(500).json({
        success: false,
        error: 'Zone lookup failed - both Google Sheets and fallback unavailable'
      });
    }

  } catch (error) {
    console.error('❌ Zone API error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
