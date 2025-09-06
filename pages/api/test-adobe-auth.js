export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 Testing Adobe PDF Services Authentication...');
  
  // Check if environment variables are set
  const hasClientId = !!process.env.ADOBE_PDF_CLIENT_ID;
  const hasClientSecret = !!process.env.ADOBE_PDF_CLIENT_SECRET;
  
  console.log('📋 Environment Variables Check:');
  console.log('   ADOBE_PDF_CLIENT_ID:', hasClientId ? '✅ Set' : '❌ Missing');
  console.log('   ADOBE_PDF_CLIENT_SECRET:', hasClientSecret ? '✅ Set' : '❌ Missing');
  
  if (!hasClientId || !hasClientSecret) {
    return res.status(400).json({
      success: false,
      error: 'Adobe PDF credentials not configured',
      details: {
        hasClientId,
        hasClientSecret
      }
    });
  }

  try {
    // Test Adobe authentication
    console.log('🔄 Testing Adobe authentication...');
    
    const authResponse = await fetch('https://ims-na1.adobelogin.com/ims/token/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.ADOBE_PDF_CLIENT_ID,
        client_secret: process.env.ADOBE_PDF_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'https://ims-na1.adobelogin.com/s/ent_documentcloud_sdk'
      })
    });
    
    console.log('📊 Adobe Auth Response Status:', authResponse.status);
    console.log('📊 Adobe Auth Response Headers:', Object.fromEntries(authResponse.headers.entries()));
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('❌ Adobe Auth Failed:', {
        status: authResponse.status,
        statusText: authResponse.statusText,
        error: errorText
      });
      
      return res.status(400).json({
        success: false,
        error: 'Adobe authentication failed',
        details: {
          status: authResponse.status,
          statusText: authResponse.statusText,
          error: errorText,
          clientIdLength: process.env.ADOBE_PDF_CLIENT_ID?.length,
          clientSecretLength: process.env.ADOBE_PDF_CLIENT_SECRET?.length,
          clientIdPrefix: process.env.ADOBE_PDF_CLIENT_ID?.substring(0, 10) + '...',
          clientSecretPrefix: process.env.ADOBE_PDF_CLIENT_SECRET?.substring(0, 10) + '...'
        }
      });
    }
    
    const authData = await authResponse.json();
    console.log('✅ Adobe authentication successful!');
    console.log('🔑 Access token received:', authData.access_token ? 'Yes' : 'No');
    console.log('⏰ Token expires in:', authData.expires_in, 'seconds');
    
    return res.status(200).json({
      success: true,
      message: 'Adobe PDF Services authentication successful!',
      details: {
        hasAccessToken: !!authData.access_token,
        tokenType: authData.token_type,
        expiresIn: authData.expires_in,
        scope: authData.scope
      }
    });
    
  } catch (error) {
    console.error('❌ Adobe authentication test failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Adobe authentication test failed',
      details: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}
