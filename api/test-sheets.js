import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    // Log the credentials being used
    console.log("Using GOOGLE_CLIENT_EMAIL:", process.env.GOOGLE_CLIENT_EMAIL);
    console.log("Using GOOGLE_SHEET_ID:", process.env.GOOGLE_SHEET_ID);

    // Check if required environment variables are present
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({
        success: false,
        error: "Missing required environment variables: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, or GOOGLE_SHEET_ID"
      });
    }

    // Create JWT auth
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    // Create sheets client
    const sheets = google.sheets({ version: "v4", auth });

    // Try to fetch a sample range from Zone tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
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
