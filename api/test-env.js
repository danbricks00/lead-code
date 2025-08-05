export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check which environment variables are available
    const envCheck = {
      gmail: {
        user: process.env.GMAIL_USER ? '✅ Set' : '❌ Missing',
        password: process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing'
      },
      google: {
        projectId: process.env.GOOGLE_PROJECT_ID ? '✅ Set' : '❌ Missing',
        privateKey: process.env.GOOGLE_PRIVATE_KEY ? '✅ Set' : '❌ Missing',
        privateKeyId: process.env.GOOGLE_PRIVATE_KEY_ID ? '✅ Set' : '❌ Missing',
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing',
        clientId: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing',
        clientCertUrl: process.env.GOOGLE_CLIENT_CERT_URL ? '✅ Set' : '❌ Missing',
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID ? '✅ Set' : '❌ Missing'
      },
      allEnvVars: Object.keys(process.env).filter(key => 
        key.includes('GMAIL') || key.includes('GOOGLE')
      )
    };

    console.log('🔍 Environment Check:', envCheck);

    res.json({
      success: true,
      message: 'Environment variables check',
      data: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error checking environment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check environment',
      details: error.message 
    });
  }
} 