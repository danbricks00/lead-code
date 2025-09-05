// Direct Xero API integration without the problematic xero-node library
// This bypasses all the token initialization issues we've been experiencing

// Function to get the current token set from storage or environment
async function getCurrentTokenSet() {
  // First try to get from stored tokens (most recent)
  try {
    const storedToken = await getStoredXeroTokenSet();
    console.log('✅ Using stored Xero token set');
    return storedToken;
  } catch (error) {
    console.log('⚠️ No stored token found, trying environment variable...');
  }
  
  // Fallback to environment variable
  const tokenSetString = process.env.XERO_TOKEN_SET?.trim();
  if (tokenSetString) {
    try {
      const envToken = JSON.parse(tokenSetString);
      console.log('✅ Using environment variable Xero token set');
      return envToken;
    } catch (parseError) {
      console.error('Failed to parse XERO_TOKEN_SET:', parseError);
    }
  }
  
  throw new Error('No valid Xero token set found. Please re-authorize via /api/xero/connect');
}

export async function initializeXeroDirectApi() {
  try {
    let tokenSet = await getCurrentTokenSet();

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
        console.log('🔄 Attempting to refresh Xero token...');
        console.log('Refresh token (first 20 chars):', tokenSet.refresh_token?.substring(0, 20) + '...');
        
        // Refresh the token using Xero's OAuth endpoint
        const refreshedTokenSet = await refreshXeroToken(tokenSet.refresh_token);
        console.log('✅ Successfully refreshed Xero token automatically');
        
        // Store the refreshed token set for future use
        await storeXeroTokenSet(refreshedTokenSet);
        console.log('✅ Refreshed token set stored successfully');
        
        // Use the refreshed token set
        tokenSet = refreshedTokenSet;
      } catch (refreshError) {
        console.error('❌ Failed to refresh token:', refreshError);
        console.error('Refresh token that failed:', tokenSet.refresh_token?.substring(0, 20) + '...');
        throw new Error('Failed to refresh Xero token. Please re-authorize via /api/xero/connect');
      }
    } else {
      console.log('Xero token is valid and ready for API calls');
    }

    // Dynamically get the tenantId
    const connectionsResponse = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${tokenSet.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!connectionsResponse.ok) {
      throw new Error('Failed to get Xero connections to determine tenantId');
    }

    const connections = await connectionsResponse.json();
    if (!connections || connections.length === 0 || !connections[0].tenantId) {
      throw new Error('Could not find a valid tenantId in Xero connections response.');
    }
    const tenantId = connections[0].tenantId;
    console.log(`Successfully retrieved dynamic tenantId: ${tenantId}`);

    return {
      accessToken: tokenSet.access_token,
      tenantId: tenantId
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

// Token storage functions using Google Sheets as a simple database
export async function storeXeroTokenSet(tokenSet) {
  try {
    // Store the token set in Google Sheets for persistence
    const { getGoogleSheetsClient, getSpreadsheetId } = await import('./googleSheets.js');
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    // Ensure TokenStorage sheet exists
    await ensureTokenStorageSheet(sheets, spreadsheetId);
    
    const values = [
      [
        new Date().toISOString(),
        'XERO_TOKEN_SET',
        JSON.stringify(tokenSet),
        'AUTO_REFRESHED'
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'TokenStorage!A:D',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values }
    });
    
    console.log('✅ Xero token set stored successfully');
  } catch (error) {
    console.error('❌ Failed to store Xero token set:', error);
    // Don't throw error - this is not critical for functionality
  }
}

async function ensureTokenStorageSheet(sheets, spreadsheetId) {
  try {
    // Try to get the sheet first
    await sheets.spreadsheets.get({ spreadsheetId });
    
    // Check if TokenStorage sheet exists
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const tokenStorageSheet = spreadsheet.data.sheets?.find(sheet => sheet.properties.title === 'TokenStorage');
    
    if (!tokenStorageSheet) {
      console.log('📝 Creating TokenStorage sheet...');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: 'TokenStorage'
              }
            }
          }]
        }
      });
      
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'TokenStorage!A1:D1',
        valueInputOption: 'RAW',
        resource: {
          values: [['Timestamp', 'TokenType', 'TokenData', 'Status']]
        }
      });
      
      console.log('✅ TokenStorage sheet created successfully');
    }
  } catch (error) {
    console.error('❌ Failed to ensure TokenStorage sheet:', error);
    throw error;
  }
}

async function getStoredXeroTokenSet() {
  try {
    const { getGoogleSheetsClient, getSpreadsheetId } = await import('./googleSheets.js');
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    // Get the most recent token set
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'TokenStorage!A:D'
    });
    
    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      throw new Error('No stored token sets found');
    }
    
    // Find the most recent XERO_TOKEN_SET entry
    const tokenRows = rows.filter(row => row[1] === 'XERO_TOKEN_SET');
    if (tokenRows.length === 0) {
      throw new Error('No Xero token sets found in storage');
    }
    
    // Get the most recent one (last in the list)
    const latestTokenRow = tokenRows[tokenRows.length - 1];
    const tokenSetString = latestTokenRow[2];
    
    return JSON.parse(tokenSetString);
  } catch (error) {
    console.error('Failed to get stored token set:', error);
    throw error;
  }
}
