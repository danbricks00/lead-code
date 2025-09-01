import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ 
      ok: false, 
      error: `Method ${req.method} Not Allowed. Use GET method.` 
    });
  }

  try {
    // Collect environment variables
    const envVars = {
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_CLIENT: process.env.GOOGLE_CLIENT,
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 
        `${process.env.GOOGLE_PRIVATE_KEY.substring(0, 50)}...` : 'NOT_SET',
      GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
      GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID
    };

    // Check for issues
    const issues = [];
    const warnings = [];

    if (!envVars.GOOGLE_CLIENT_EMAIL && !envVars.GOOGLE_CLIENT) {
      issues.push("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_CLIENT");
    }

    if (!process.env.GOOGLE_PRIVATE_KEY) {
      issues.push("Missing GOOGLE_PRIVATE_KEY");
    }

    if (!envVars.GOOGLE_SHEET_ID && !envVars.GOOGLE_SPREADSHEET_ID) {
      issues.push("Missing GOOGLE_SHEET_ID or GOOGLE_SPREADSHEET_ID");
    }

    // Check if values look like placeholders
    if (envVars.GOOGLE_CLIENT_EMAIL === 'GOOGLE_CLIENT_EMAIL') {
      warnings.push("GOOGLE_CLIENT_EMAIL appears to be a placeholder");
    }

    if (envVars.GOOGLE_CLIENT === 'GOOGLE_CLIENT') {
      warnings.push("GOOGLE_CLIENT appears to be a placeholder");
    }

    if (process.env.GOOGLE_PRIVATE_KEY === 'GOOGLE_PRIVATE_KEY') {
      warnings.push("GOOGLE_PRIVATE_KEY appears to be a placeholder");
    }

    // Determine which email to use
    const clientEmail = envVars.GOOGLE_CLIENT_EMAIL || envVars.GOOGLE_CLIENT;
    const sheetId = envVars.GOOGLE_SHEET_ID || envVars.GOOGLE_SPREADSHEET_ID;

    console.log("🔍 Debug Google Auth - Environment Variables:");
    console.log("Client Email:", clientEmail);
    console.log("Sheet ID:", sheetId);
    console.log("Private Key Length:", process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0);
    console.log("Issues:", issues);
    console.log("Warnings:", warnings);

    // If there are critical issues, return early
    if (issues.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "Environment variables not configured properly",
        issues,
        warnings,
        envVars
      });
    }

    // Try to authenticate
    try {
      const auth = new google.auth.JWT(
        clientEmail,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        ["https://www.googleapis.com/auth/spreadsheets.readonly"]
      );

      const sheets = google.sheets({ version: "v4", auth });

      // Test with a simple read operation
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "Zone!A1:C5"
      });

      console.log("✅ Google Sheets authentication successful");
      console.log("✅ Test read successful - found", response.data.values?.length || 0, "rows");

      return res.status(200).json({
        ok: true,
        message: "Google Sheets authentication successful",
        testData: response.data.values?.slice(0, 3) || [],
        warnings,
        envVars
      });

    } catch (authError) {
      console.error("❌ Google Sheets authentication failed:", authError.message);
      
      return res.status(500).json({
        ok: false,
        error: "Google Sheets authentication failed",
        details: authError.message,
        warnings,
        envVars
      });
    }

  } catch (error) {
    console.error("❌ Debug endpoint error:", error.message);
    return res.status(500).json({ 
      ok: false, 
      error: `Debug endpoint error: ${error.message}` 
    });
  }
}
