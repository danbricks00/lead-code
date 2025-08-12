export default async function handler(req, res) {
  console.log('🔧 Testing Xero Configuration');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Check environment variables
      const clientId = process.env.XERO_CLIENT_ID;
      const clientSecret = process.env.XERO_CLIENT_SECRET;
      const redirectUri = process.env.XERO_REDIRECT_URI;

      const config = {
        clientId: clientId ? `${clientId.substring(0, 8)}...` : 'NOT SET',
        clientSecret: clientSecret ? 'SET' : 'NOT SET',
        redirectUri: redirectUri || 'NOT SET',
        hasAllRequired: !!(clientId && clientSecret && redirectUri)
      };

      console.log('✅ Xero config check:', config);

      return res.status(200).json({
        success: true,
        message: 'Xero configuration check',
        config: config,
        instructions: config.hasAllRequired ? 
          'All required variables are set. Check your Xero app settings.' : 
          'Missing required environment variables.'
      });

    } catch (error) {
      console.error('❌ Config check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Configuration check failed',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
