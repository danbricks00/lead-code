// Direct Xero API integration without the problematic xero-node library
// This bypasses all the token initialization issues we've been experiencing

export async function initializeXeroDirectApi() {
  try {
    const tokenSetString = process.env.XERO_TOKEN_SET?.trim();
    if (!tokenSetString) {
      throw new Error('XERO_TOKEN_SET environment variable not configured');
    }

    let tokenSet;
    try {
      tokenSet = JSON.parse(tokenSetString);
    } catch (parseError) {
      console.error('Failed to parse XERO_TOKEN_SET:', parseError);
      throw new Error('XERO_TOKEN_SET is malformed JSON');
    }

    // Check if token is expired (expires_at is a Unix timestamp)
    const now = Math.floor(Date.now() / 1000);
    const isExpired = tokenSet.expires_at && tokenSet.expires_at < now;
    
    if (isExpired) {
      console.log('Access token is expired. Attempting to refresh using refresh token...');
      
      if (!tokenSet.refresh_token) {
        console.error('No refresh token available. Manual re-authorization required.');
        throw new Error('Xero token has expired and no refresh token available. Please re-authorize via /api/xero/connect');
      }

      try {
        // Refresh the token using Xero's OAuth endpoint
        tokenSet = await refreshXeroToken(tokenSet.refresh_token);
        console.log('Successfully refreshed Xero token automatically');
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        throw new Error('Failed to refresh Xero token. Please re-authorize via /api/xero/connect');
      }
    } else {
      console.log('Xero token is valid and ready for API calls');
    }

    return {
      accessToken: tokenSet.access_token,
      tenantId: '05ea29ea-7ba4-4ec5-8398-fe105ef32e73' // Your tenant ID from the logs
    };
  } catch (error) {
    console.error('Failed to initialize Xero Direct API:', error);
    throw error;
  }
}

async function refreshXeroToken(refreshToken) {
  const response = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Token refresh failed (${response.status}):`, errorText);
    throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
  }

  const newTokenData = await response.json();
  
  // Convert to the same format as the original token
  const refreshedToken = {
    id_token: newTokenData.id_token || '',
    access_token: newTokenData.access_token,
    expires_at: Math.floor(Date.now() / 1000) + newTokenData.expires_in,
    token_type: newTokenData.token_type || 'Bearer',
    refresh_token: newTokenData.refresh_token || refreshToken, // Keep old refresh token if new one not provided
    scope: newTokenData.scope || '',
    session_state: newTokenData.session_state || ''
  };

  console.log('🔄 Token refreshed successfully. New expiry:', new Date(refreshedToken.expires_at * 1000).toLocaleString());
  
  return refreshedToken;
}

export async function makeXeroApiCall(endpoint, method = 'GET', body = null, xeroConfig) {
  const { accessToken, tenantId } = xeroConfig;
  
  const url = `https://api.xero.com/api.xro/2.0/${endpoint}`;
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Xero-Tenant-Id': tenantId,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  const options = {
    method,
    headers
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  console.log(`Making Xero API call: ${method} ${url}`);
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Xero API Error (${response.status}):`, errorText);
    throw new Error(`Xero API call failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function getXeroQuoteAsPdf(quoteId, xeroConfig) {
  const { accessToken, tenantId } = xeroConfig;
  
  const url = `https://api.xero.com/api.xro/2.0/Quotes/${quoteId}`;
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Xero-Tenant-Id': tenantId,
    'Accept': 'application/pdf'
  };

  console.log(`Downloading PDF for quote: ${quoteId}`);
  
  const response = await fetch(url, { method: 'GET', headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Xero PDF Error (${response.status}):`, errorText);
    throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
  }

  const pdfBuffer = await response.arrayBuffer();
  return Buffer.from(pdfBuffer);
}
