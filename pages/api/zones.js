import { google } from "googleapis";

// Helper function to load fallback zones from JSON file
function loadFallbackZonesFromJSON() {
  try {
    const path = require("path");
    const fs = require("fs");
    const filePath = path.join(process.cwd(), "public", "zone-data.json");
    const jsonData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(jsonData);
  } catch (e) {
    console.error("❌ Failed to load fallback JSON file:", e.message);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ 
      ok: false, 
      error: `Method ${req.method} Not Allowed for Zones. Use GET method.` 
    });
  }

  try {
    console.log("Zones API called - attempting Google Sheets fetch");
    
    // Handle private key properly
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey) {
             console.log("No GOOGLE_PRIVATE_KEY configured - using fallback JSON");
       const fallbackData = loadFallbackZonesFromJSON();
      if (fallbackData.length > 0) {
        // Organize fallback data
        const zonesData = {};
        fallbackData.forEach(item => {
          if (!zonesData[item.area]) {
            zonesData[item.area] = [];
          }
          zonesData[item.area].push({
            suburb: item.suburb,
            postcode: ""
          });
        });
        
        const sortedAreas = Object.keys(zonesData).sort();
        const organizedData = {};
        sortedAreas.forEach(area => {
          organizedData[area] = zonesData[area].sort((a, b) => a.suburb.localeCompare(b.suburb));
        });
        
        console.log("✅ Using fallback JSON data - found", fallbackData.length, "zones");
        return res.status(200).json({
          ok: true,
          areas: sortedAreas,
          groupedData: organizedData,
          source: "fallback"
        });
      }
      return res.status(500).json({ 
        ok: false, 
        error: "Google Sheets not configured and fallback not available" 
      });
    }

    // Clean up private key - handle both formats
    const cleanPrivateKey = privateKey.includes('\\n') 
      ? privateKey.replace(/\\n/g, '\n')
      : privateKey;

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      cleanPrivateKey,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
           if (!sheetId) {
         console.log("No Google Sheet ID configured - using fallback JSON");
         const fallbackData = loadFallbackZonesFromJSON();
      if (fallbackData.length > 0) {
        // Organize fallback data
        const zonesData = {};
        fallbackData.forEach(item => {
          if (!zonesData[item.area]) {
            zonesData[item.area] = [];
          }
          zonesData[item.area].push({
            suburb: item.suburb,
            postcode: ""
          });
        });
        
        const sortedAreas = Object.keys(zonesData).sort();
        const organizedData = {};
        sortedAreas.forEach(area => {
          organizedData[area] = zonesData[area].sort((a, b) => a.suburb.localeCompare(b.suburb));
        });
        
        console.log("✅ Using fallback JSON data - found", fallbackData.length, "zones");
        return res.status(200).json({
          ok: true,
          areas: sortedAreas,
          groupedData: organizedData,
          source: "fallback"
        });
      }
      return res.status(500).json({ 
        ok: false, 
        error: "Google Sheet ID not configured and fallback not available" 
      });
    }

    const range = "Zone!A:C";
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values;
         if (!rows || rows.length === 0) {
       console.log("No data found in Zone sheet - using fallback JSON");
       const fallbackData = loadFallbackZonesFromJSON();
      if (fallbackData.length > 0) {
        // Organize fallback data
        const zonesData = {};
        fallbackData.forEach(item => {
          if (!zonesData[item.area]) {
            zonesData[item.area] = [];
          }
          zonesData[item.area].push({
            suburb: item.suburb,
            postcode: ""
          });
        });
        
        const sortedAreas = Object.keys(zonesData).sort();
        const organizedData = {};
        sortedAreas.forEach(area => {
          organizedData[area] = zonesData[area].sort((a, b) => a.suburb.localeCompare(b.suburb));
        });
        
        console.log("✅ Using fallback JSON data - found", fallbackData.length, "zones");
        return res.status(200).json({
          ok: true,
          areas: sortedAreas,
          groupedData: organizedData,
          source: "fallback"
        });
      }
      return res.status(404).json({ 
        ok: false, 
        error: "No zone data found in Google Sheets or fallback" 
      });
    }

    // Skip header row and organize data
    const dataRows = rows.slice(1);
    const zonesData = {};

    dataRows.forEach(row => {
      const suburb = row[0];
      const area = row[1];
      const postcode = row[2];

      if (suburb && area) {
        if (!zonesData[area]) {
          zonesData[area] = [];
        }
        zonesData[area].push({
          suburb: suburb,
          postcode: postcode || ""
        });
      }
    });

    // Sort areas alphabetically and suburbs within each area
    const sortedAreas = Object.keys(zonesData).sort();
    const organizedData = {};

    sortedAreas.forEach(area => {
      organizedData[area] = zonesData[area].sort((a, b) => a.suburb.localeCompare(b.suburb));
    });

    console.log("✅ Successfully fetched zone data from Google Sheets");
    return res.status(200).json({
      ok: true,
      areas: sortedAreas,
      groupedData: organizedData,
      source: "sheets"
    });

     } catch (zoneError) {
     console.error("Zone data error:", zoneError);
     console.log("🔄 Falling back to JSON file data");
     
     // Try fallback JSON file
     const fallbackData = loadFallbackZonesFromJSON();
    if (fallbackData.length > 0) {
      // Organize fallback data
      const zonesData = {};
      fallbackData.forEach(item => {
        if (!zonesData[item.area]) {
          zonesData[item.area] = [];
        }
        zonesData[item.area].push({
          suburb: item.suburb,
          postcode: ""
        });
      });
      
      const sortedAreas = Object.keys(zonesData).sort();
      const organizedData = {};
      sortedAreas.forEach(area => {
        organizedData[area] = zonesData[area].sort((a, b) => a.suburb.localeCompare(b.suburb));
      });
      
      console.log("✅ Using fallback JSON data - found", fallbackData.length, "zones");
      return res.status(200).json({
        ok: true,
        areas: sortedAreas,
        groupedData: organizedData,
        source: "fallback"
      });
    }
    
    return res.status(500).json({ 
      ok: false, 
      error: `Zone data error: ${zoneError.message}` 
    });
  }
}
