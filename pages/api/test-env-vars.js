export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check email environment variables
  const envStatus = {
    GMAIL_USER: process.env.GMAIL_USER || "MISSING",
    GMAIL_PASS: process.env.GMAIL_PASS ? "SET" : "MISSING",
    TEAM_EMAIL: process.env.TEAM_EMAIL || "MISSING",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "MISSING"
  };

  // Log to server console
  console.log("🔧 Email Environment Variables Check:", envStatus);

  // Return JSON response
  return res.status(200).json({
    success: true,
    message: "Email environment variables status",
    envVars: envStatus,
    timestamp: new Date().toISOString()
  });
}
