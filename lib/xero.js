import { XeroClient } from 'xero-node';
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
].join(' ');

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/xero/callback`
  ],
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
    
    await xero.setTokenSet(tokenSet);

    if (xero.tokenSet.expired()) {
        console.log('Xero token expired, attempting to refresh...');
        const newTokenSet = await xero.refreshToken();
        console.log('Successfully refreshed Xero token.');
        // In a real app, you'd securely persist the newTokenSet
        if (process.env.VERCEL) {
          // Vercel doesn't have a persistent filesystem between invocations in the same way.
          // The updated token lives in memory for the life of this function invocation.
          // For long-term persistence, you'd need a database or to update the env var.
        } else {
          await fs.writeFile(tokenPath, JSON.stringify(newTokenSet, null, 2));
          console.log('Saved refreshed token to file.');
        }
    }

    // This is crucial to select which organization you're working with
    await xero.updateTenants();
    const activeTenant = xero.tenants[0];
    console.log(`Xero client initialized. Active tenant: ${activeTenant.tenantName}`);
    
    return activeTenant.tenantId; // Return tenantId for API calls
  } catch (error) {
    console.error('Failed to initialize Xero client:', error);
    // This will cause API calls to fail, which is appropriate if initialization fails.
    throw new Error('Xero client could not be initialized. Check token set and configuration.');
  }
}


export { xero, initializeXero };
