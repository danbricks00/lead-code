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
    const { search } = req.query; 

    const filterLogic = (zones) => {
        if (!search) {
          // If no search term, return all zones, which is useful for initializing the chatbot
          return zones;
        }
        
        // Return zones where the suburb starts with the search term (case-insensitive)
        return zones.filter(zone => 
            (zone.suburb || '').toLowerCase().startsWith(search.toLowerCase())
        );
    };

    // Try Google Sheets first
    try {
      const sheets = getGoogleSheetsClient();
      const sheetId = getSpreadsheetId();
      
      if (sheetId) {
        console.log("📊 Attempting Google Sheets zone lookup...");
        
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'Zone!A:Z',
        });

        const rows = response.data.values || [];
        console.log(`📊 Found ${rows.length - 1} total zones in Google Sheets`);

        const allZones = rows.slice(1).map(row => ({
            suburb: row[0] || '',
            area: row[1] || '',
            zone: row[2] || ''
        }));
        
        const filteredZones = filterLogic(allZones);

        if (filteredZones.length > 0) {
          console.log(`✅ Found ${filteredZones.length} matching zones in Google Sheets`);
          return res.status(200).json({
            success: true,
            rows: filteredZones,
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
      // Use path and fs for a reliable file path
      const path = require('path');
      const fs = require('fs').promises;
      const filePath = path.join(process.cwd(), 'data', 'zones.json');
      const fileContents = await fs.readFile(filePath, 'utf8');
      const zones = JSON.parse(fileContents);
      
      const filteredZones = filterLogic(zones);

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
