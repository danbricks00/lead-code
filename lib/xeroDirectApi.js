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
      console.log('Token is expired. You need to refresh it manually via /api/xero/connect flow.');
      throw new Error('Xero token has expired and needs manual refresh');
    }

    console.log('Xero token is valid and ready for API calls');
    return {
      accessToken: tokenSet.access_token,
      tenantId: '05ea29ea-7ba4-4ec5-8398-fe105ef32e73' // Your tenant ID from the logs
    };
  } catch (error) {
    console.error('Failed to initialize Xero Direct API:', error);
    throw error;
  }
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
