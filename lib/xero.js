import { XeroClient, TokenSet } from 'xero-node';
import { promises as fs } from 'fs';
import path from 'path';

// For Vercel, use a temporary directory for token storage
const tokenPath = path.join('/tmp', 'xero_token_set.json');

console.log('Initializing Xero client...');
console.log(`XERO_CLIENT_ID: ${process.env.XERO_CLIENT_ID ? 'Loaded' : 'MISSING!'}`);
const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/xero/callback`;
console.log(`Xero Redirect URI configured as: ${redirectUri}`);

const scopes = [
  'openid',
  'profile',
  'email',
  'accounting.contacts',
  'accounting.transactions',
  'accounting.settings.read',
  'offline_access',
];

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  scopes: scopes,
});

async function initializeXero() {
  try {
    let tokenSet;
    if (process.env.XERO_TOKEN_SET) {
      const tokenSetString = process.env.XERO_TOKEN_SET.trim();
      try {
        console.log('Attempting to parse XERO_TOKEN_SET directly...');
        tokenSet = JSON.parse(tokenSetString);
      } catch (e) {
        console.warn('Direct JSON.parse failed. Attempting robust parse...');
        console.log('Original parsing error:', e.message);
        // This is a more aggressive cleaning method for corrupted JSON strings
        try {
            const correctedString = tokenSetString.replace(/\\"/g, '"').replace(/^"|"$/g, '');
            tokenSet = JSON.parse(correctedString);
            console.log('Robust parse successful.');
        } catch (finalError) {
             console.error('FATAL: Robust JSON parsing failed. The XERO_TOKEN_SET is fundamentally malformed.');
             throw finalError; // Re-throw the fatal error
        }
      }
    } else {
      throw new Error('XERO_TOKEN_SET is not configured.');
    }
    
    // Create a new, robust initialization flow.
    // 1. Create a TokenSet instance from the raw token data.
    const initialTokenSet = new TokenSet(tokenSet);
    let validTokenSet;

    // 2. Check if it's expired and refresh if necessary BEFORE configuring the client.
    if (initialTokenSet.expired()) {
        console.log('Xero token expired, attempting to refresh...');
        // Use the main client's config to refresh the token, passing the expired token explicitly.
        validTokenSet = await xero.refreshToken(initialTokenSet);
        console.log('Successfully refreshed Xero token.');
    } else {
        // If not expired, the initial token is our valid token.
        validTokenSet = initialTokenSet;
        console.log('Xero token is valid.');
    }

    // 3. Now, with a guaranteed valid token, initialize the client.
    await xero.setTokenSet(validTokenSet);

    // 4. Add a failsafe to ensure the token was set correctly.
    if (!xero.tokenSet) {
        throw new Error('[FATAL] xero.setTokenSet() failed to set the token on the client instance.');
    }
    
    // This is crucial to select which organization you're working with
    if (!xero.tenants || xero.tenants.length === 0) {
      console.log('Tenants not found or empty, updating tenants...');
      await xero.updateTenants();
    }
    
    if (!xero.tenants || xero.tenants.length === 0) {
      throw new Error('No active Xero tenants found after update.');
    }

    const activeTenant = xero.tenants[0];
    xero.setTenantId(activeTenant.tenantId); // Set the active tenant
    console.log(`Xero client initialized. Active tenant: ${activeTenant.tenantName}`);
    
    return xero;
  } catch (error) {
    console.error('Failed to initialize Xero client:', error);
    // This will cause API calls to fail, which is appropriate if initialization fails.
    throw new Error('Xero client could not be initialized. Check token set and configuration.');
  }
}


export { xero, initializeXero };
