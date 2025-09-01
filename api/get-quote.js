import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ 
      ok: false, 
      error: `Method ${req.method} Not Allowed. Use GET method.` 
    });
  }

  const { leadId } = req.query;
  
  if (!leadId) {
    return res.status(400).json({ 
      ok: false, 
      error: "Missing required parameter: leadId" 
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
    
    // Fetch all quotes to find the matching leadId
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Quotes!A:Z"
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: "No quotes found" 
      });
    }

    // Find the row with matching leadId (assuming leadId is in column B)
    const quoteRow = rows.find(row => row[1] === leadId);
    
    if (!quoteRow) {
      return res.status(404).json({ 
        ok: false, 
        error: `Quote not found for leadId: ${leadId}` 
      });
    }

    // Map the row data to structured JSON
    // Assuming columns: A=Timestamp, B=LeadId, C=CustomerName, D=Service, E=QuoteAmount, F=Details, G=Status, H=Timeline, etc.
    const quoteData = {
      leadId: quoteRow[1] || "",
      customerName: quoteRow[2] || "",
      service: quoteRow[3] || "",
      quoteAmount: quoteRow[4] || "",
      details: quoteRow[5] || "",
      status: quoteRow[6] || "Pending",
      timeline: quoteRow[7] || "",
      area: quoteRow[8] || "",
      suburb: quoteRow[9] || "",
      budget: quoteRow[10] || "",
      specificDetails: quoteRow[11] || "",
      tradesmanName: quoteRow[12] || "",
      tradesmanEmail: quoteRow[13] || "",
      quoteDate: quoteRow[0] || new Date().toISOString(),
      // Add any additional fields as needed
    };

    console.log(`🌐 Quote data served from unified /api/get-quote for lead ${leadId}`);
    
    return res.status(200).json({
      ok: true,
      quote: quoteData
    });

  } catch (error) {
    console.error("❌ Get quote error:", error.message);
    return res.status(500).json({ 
      ok: false, 
      error: `Failed to fetch quote: ${error.message}` 
    });
  }
}
