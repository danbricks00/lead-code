import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    // Collect and validate environment variables
    const envVars = {
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID
    };

    // Build validation report
    const report = {
      GOOGLE_CLIENT_EMAIL: !!envVars.GOOGLE_CLIENT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!envVars.GOOGLE_PRIVATE_KEY,
      GOOGLE_SHEET_ID: !!envVars.GOOGLE_SHEET_ID
    };

    // Check for missing or placeholder values
    const warnings = [];
    const requiredVars = ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_SHEET_ID'];
    
    requiredVars.forEach(varName => {
      const value = envVars[varName];
      if (!value) {
        warnings.push(`⚠️ ${varName} is missing`);
      } else if (value === varName || value === `process.env.${varName}` || value.includes('YOUR_')) {
        warnings.push(`⚠️ ${varName} appears to be a placeholder: "${value}"`);
      }
    });

    // Log to Vercel console
    console.log("Using GOOGLE_CLIENT_EMAIL:", envVars.GOOGLE_CLIENT_EMAIL);
    console.log("Using GOOGLE_SHEET_ID:", envVars.GOOGLE_SHEET_ID);
    console.log("Env Validation Report:", report);

    // If any issues found, return error with details
    if (warnings.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid environment variables",
        warnings,
        details: report
      });
    }

    // All env vars look valid, attempt Google Sheets connection
    const auth = new google.auth.JWT(
      envVars.GOOGLE_CLIENT_EMAIL,
      null,
      envVars.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    // Try to fetch a sample range from Zone tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: envVars.GOOGLE_SHEET_ID,
      range: "Zone!A1:C5"
    });

    // Return success with the raw values
    return res.status(200).json({
      success: true,
      rows: response.data.values || []
    });

  } catch (error) {
    console.error("Google Sheets test failed:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
