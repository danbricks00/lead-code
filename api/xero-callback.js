export default async function handler(req, res) {
  console.log('🔄 Xero OAuth Callback called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        console.error('❌ No authorization code received');
        return res.status(400).json({
          success: false,
          error: 'No authorization code received'
        });
      }

      console.log('✅ Authorization code received:', code);

      // Exchange code for access token
      const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.XERO_REDIRECT_URI,
          client_id: process.env.XERO_CLIENT_ID,
          client_secret: process.env.XERO_CLIENT_SECRET,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ Token exchange failed:', errorText);
        return res.status(400).json({
          success: false,
          error: 'Token exchange failed',
          details: errorText
        });
      }

      const tokens = await tokenResponse.json();
      console.log('✅ Access token received');

      // Store tokens (in production, use Vercel KV or similar)
      // For now, we'll store in environment variables (not recommended for production)
      
      // Get tenant ID
      const tenantResponse = await fetch('https://api.xero.com/connections', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (tenantResponse.ok) {
        const tenants = await tenantResponse.json();
        if (tenants.length > 0) {
          const tenantId = tenants[0].tenantId;
          console.log('✅ Tenant ID:', tenantId);
          
          // Store tenant ID (you might want to store this in a database)
          // For now, we'll use it in the response
          
          return res.status(200).json({
            success: true,
            message: 'Xero authentication successful!',
            data: {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              tenantId: tenantId,
              expiresIn: tokens.expires_in
            },
            instructions: 'You can now use Xero API for quote generation'
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Xero authentication successful!',
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in
        },
        instructions: 'Authentication complete. You may need to set up tenant access.'
      });

    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      return res.status(500).json({
        success: false,
        error: 'OAuth callback failed',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
