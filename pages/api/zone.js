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
        if (!search || typeof search !== 'string') {
          // If no search term, return all zones, which is useful for initializing the chatbot
          return zones;
        }
        
        const searchLower = search.toLowerCase();
        
        // Return zones where the suburb OR altName starts with the search term (case-insensitive)
        return zones.filter(zone => {
            const suburb = (zone.suburb && typeof zone.suburb === 'string') ? zone.suburb.toLowerCase() : '';
            const altName = (zone.altName && typeof zone.altName === 'string') ? zone.altName.toLowerCase() : '';
            
            return suburb.startsWith(searchLower) || altName.startsWith(searchLower);
        });
    };

    // Try Google Sheets first
    try {
      const sheets = getGoogleSheetsClient();
      const sheetId = getSpreadsheetId();
      
      if (sheetId) {
        console.log("📊 Attempting Google Sheets zone lookup...");
        
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'Zone!A:G', // Updated to match new schema: suburb, AltName, PostCode, Area, Zone, Zone Cost, ZoneKm
        });

        const rows = response.data.values || [];
        console.log(`📊 Found ${rows.length - 1} total zones in Google Sheets`);

        const allZones = rows.slice(1).map((row, index) => {
            const zone = {
                suburb: row[0] || '',           // A: suburb
                altName: row[1] || '',          // B: AltName (Māori spelling alternative)
                postCode: row[2] || '',         // C: PostCode
                area: row[3] || '',             // D: Area
                zone: row[4] || '',             // E: Zone
                zoneCost: row[5] || '',         // F: Zone Cost
                zoneKm: row[6] || ''            // G: ZoneKm
            };
            
            // Debug logging for problematic rows
            if (index < 5) {
                console.log(`🔍 Zone ${index + 1}:`, JSON.stringify(zone));
            }
            
            return zone;
        });
        
        const filteredZones = filterLogic(allZones);

        if (filteredZones.length > 0) {
          console.log(`✅ Found ${filteredZones.length} matching zones in Google Sheets`);
          
          // Log if any alternative names were matched
          const altNameMatches = filteredZones.filter(zone => 
            zone.altName && typeof zone.altName === 'string' && search && typeof search === 'string' && zone.altName.toLowerCase().startsWith(search.toLowerCase())
          );
          if (altNameMatches.length > 0) {
            console.log(`🔤 Found ${altNameMatches.length} matches using alternative names (Māori spelling)`);
          }
          
          return res.status(200).json({
            success: true,
            rows: filteredZones,
            source: 'google-sheets',
            altNameMatches: altNameMatches.length
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
      
      // Ensure fallback zones have all the new fields for compatibility
      const enhancedZones = zones.map(zone => ({
        suburb: zone.suburb || '',
        altName: zone.altName || '', // Will be empty for existing fallback data
        postCode: zone.postCode || '',
        area: zone.area || '',
        zone: zone.zone || '',
        zoneCost: zone.zoneCost || '',
        zoneKm: zone.zoneKm || ''
      }));
      
      const filteredZones = filterLogic(enhancedZones);

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
