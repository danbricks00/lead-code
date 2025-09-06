export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 Debugging Adobe PDF Services Configuration...');
  
  // Check environment variables
  const clientId = process.env.ADOBE_PDF_CLIENT_ID;
  const clientSecret = process.env.ADOBE_PDF_CLIENT_SECRET;
  
  const debugInfo = {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId?.length || 0,
    clientSecretLength: clientSecret?.length || 0,
    clientIdFormat: clientId ? (clientId.includes('-') ? 'Contains hyphens' : 'No hyphens') : 'N/A',
    clientSecretFormat: clientSecret ? (clientSecret.includes('-') ? 'Contains hyphens' : 'No hyphens') : 'N/A',
    clientIdPrefix: clientId ? clientId.substring(0, 20) + '...' : 'N/A',
    clientSecretPrefix: clientSecret ? clientSecret.substring(0, 20) + '...' : 'N/A'
  };
  
  console.log('📋 Adobe Configuration Debug:', debugInfo);
  
  if (!clientId || !clientSecret) {
    return res.status(400).json({
      success: false,
      error: 'Adobe PDF credentials not found',
      debug: debugInfo
    });
  }
  
  // Test the exact same authentication flow as in pdfGenerator.js
  try {
    console.log('🔄 Testing Adobe authentication with current implementation...');
    
    const authResponse = await fetch('https://ims-na1.adobelogin.com/ims/token/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'https://ims-na1.adobelogin.com/s/ent_documentcloud_sdk'
      })
    });
    
    console.log('📊 Auth Response Status:', authResponse.status);
    console.log('📊 Auth Response Headers:', Object.fromEntries(authResponse.headers.entries()));
    
    const responseText = await authResponse.text();
    console.log('📊 Raw Response:', responseText);
    
    if (!authResponse.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { raw: responseText };
      }
      
      return res.status(400).json({
        success: false,
        error: 'Adobe authentication failed',
        status: authResponse.status,
        statusText: authResponse.statusText,
        response: errorData,
        debug: debugInfo
      });
    }
    
    const authData = JSON.parse(responseText);
    
    return res.status(200).json({
      success: true,
      message: 'Adobe authentication successful!',
      authData: {
        tokenType: authData.token_type,
        expiresIn: authData.expires_in,
        scope: authData.scope,
        hasAccessToken: !!authData.access_token
      },
      debug: debugInfo
    });
    
  } catch (error) {
    console.error('❌ Adobe authentication error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Adobe authentication test failed',
      message: error.message,
      debug: debugInfo
    });
  }
}
