import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ 
      ok: false, 
      error: `Method ${req.method} Not Allowed. Use GET method.` 
    });
  }

  const { adminEmail, adminPassword } = req.query;
  
  if (!adminEmail || !adminPassword) {
    return res.status(400).json({ 
      ok: false, 
      error: "Missing required parameters: adminEmail, adminPassword" 
    });
  }

  // Admin authentication
  if (adminEmail !== process.env.ADMIN_EMAIL || adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ 
      ok: false, 
      error: "Invalid admin credentials" 
    });
  }

  try {
    // Check if Google Sheets environment variables are configured
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
    
    if (!privateKey || !sheetId) {
      return res.status(500).json({ 
        ok: false, 
        error: "Google Sheets not configured" 
      });
    }

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      privateKey.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );
    
    const sheets = google.sheets({ version: "v4", auth });
    
    // Fetch all quotes from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Quotes!A:Z"
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(200).json({
        ok: true,
        pendingQuotes: []
      });
    }

    // Filter for pending quotes (status = "Pending")
    const pendingQuotes = rows
      .filter(row => row[6] === "Pending") // Status column
      .map(row => ({
        leadId: row[1] || "",
        customerName: row[2] || "",
        service: row[3] || "",
        quoteAmount: row[4] || "",
        details: row[5] || "",
        status: row[6] || "Pending",
        timeline: row[7] || "",
        area: row[8] || "",
        suburb: row[9] || "",
        budget: row[10] || "",
        specificDetails: row[11] || "",
        tradesmanName: row[12] || "",
        tradesmanEmail: row[13] || "",
        tradesmanPhone: row[14] || "",
        projectSize: row[15] || "",
        breakdown: row[16] || "",
        notes: row[17] || "",
        companyName: row[19] || "",
        quoteDate: row[0] || new Date().toISOString()
      }));

    console.log(`📋 Admin ${adminEmail} fetched ${pendingQuotes.length} pending quotes`);
    
    return res.status(200).json({
      ok: true,
      pendingQuotes,
      count: pendingQuotes.length
    });

  } catch (error) {
    console.error("❌ Get pending quotes error:", error.message);
    return res.status(500).json({ 
      ok: false, 
      error: `Failed to fetch pending quotes: ${error.message}` 
    });
  }
}
