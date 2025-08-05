// Test API with environment variables
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Hello World!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    envTest: {
      hasGoogleKey: !!process.env.GOOGLE_API_KEY,
      hasSpreadsheetId: !!process.env.SPREADSHEET_ID,
      hasGmailUser: !!process.env.GMAIL_USER
    }
  });
} 