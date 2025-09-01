// pages/api/test-env.js - Debug endpoint for environment variables
export default async function handler(req, res) {
  console.log("✅ Loaded API test-env.js");

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed. Use GET method.`
    });
  }

  try {
    console.log("🔧 Checking environment variables...");

    const envVars = {
      GMAIL_USER: process.env.GMAIL_USER || "NOT_SET",
      GMAIL_PASS: process.env.GMAIL_PASS ? "SET" : "NOT_SET",
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || "NOT_SET",
      TEAM_EMAIL: process.env.TEAM_EMAIL || "NOT_SET",
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL || "NOT_SET",
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? "SET" : "NOT_SET",
      GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || "NOT_SET",
      GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID || "NOT_SET",
      SITE_URL: process.env.SITE_URL || "NOT_SET",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT_SET",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "NOT_SET",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT_SET"
    };

    console.log("🔧 Environment variables status:", envVars);

    return res.status(200).json({
      success: true,
      environment: envVars,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test env API error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Test env failed',
      message: error.message
    });
  }
}
