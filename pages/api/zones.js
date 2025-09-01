import { google } from "googleapis";

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
      console.log("No GOOGLE_PRIVATE_KEY configured");
      return res.status(500).json({ 
        ok: false, 
        error: "Google Sheets not configured" 
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
      console.log("No Google Sheet ID configured");
      return res.status(500).json({ 
        ok: false, 
        error: "Google Sheet ID not configured" 
      });
    }

    const range = "Zone!A:C";
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("No data found in Zone sheet");
      return res.status(404).json({ 
        ok: false, 
        error: "No zone data found in Google Sheets" 
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

    console.log("Successfully fetched zone data from Google Sheets");
    return res.status(200).json({
      ok: true,
      areas: sortedAreas,
      groupedData: organizedData
    });

  } catch (zoneError) {
    console.error("Zone data error:", zoneError);
    return res.status(500).json({ 
      ok: false, 
      error: `Zone data error: ${zoneError.message}` 
    });
  }
}
