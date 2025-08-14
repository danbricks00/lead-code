export default async function handler(req, res) {
  console.log('🔧 Testing Xero Scopes');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const clientId = process.env.XERO_CLIENT_ID;
      const redirectUri = encodeURIComponent('https://lead-code.vercel.app/api/xero-callback');
      
      // Test different scope combinations
      const scopeTests = [
        {
          name: 'Basic Scopes',
          scope: 'offline_access accounting.transactions accounting.contacts accounting.settings'
        },
        {
          name: 'Minimal Scopes',
          scope: 'offline_access accounting.transactions.read accounting.contacts.read'
        },
        {
          name: 'Read Only',
          scope: 'offline_access accounting.transactions.read accounting.contacts.read accounting.settings.read'
        },
        {
          name: 'Full Access',
          scope: 'offline_access accounting.transactions accounting.contacts accounting.settings accounting.reports.read'
        }
      ];

      const testUrls = scopeTests.map(test => ({
        name: test.name,
        url: `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(test.scope)}&state=test123`
      }));

      return res.status(200).json({
        success: true,
        message: 'Xero scope test URLs',
        clientId: clientId ? `${clientId.substring(0, 8)}...` : 'NOT SET',
        redirectUri: 'https://lead-code.vercel.app/api/xero-callback',
        testUrls: testUrls
      });

    } catch (error) {
      console.error('❌ Scope test error:', error);
      return res.status(500).json({
        success: false,
        error: 'Scope test failed',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
