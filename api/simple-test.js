export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({ 
    message: 'Simple test API working!',
    method: req.method,
    timestamp: new Date().toISOString(),
    env: {
      hasGmail: !!process.env.GMAIL_USER,
      hasGoogle: !!process.env.GOOGLE_PROJECT_ID
    }
  });
} 