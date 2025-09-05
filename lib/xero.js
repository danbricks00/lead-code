import { XeroClient } from 'xero-node';
import { promises as fs } from 'fs';
import path from 'path';

// For Vercel, use a temporary directory for token storage
const tokenPath = path.join('/tmp', 'xero_token_set.json');

console.log('Initializing Xero client...');
console.log(`XERO_CLIENT_ID: ${process.env.XERO_CLIENT_ID ? 'Loaded' : 'MISSING!'}`);
const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/xero/callback`;
console.log(`Xero Redirect URI configured as: ${redirectUri}`);

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [redirectUri],
  scopes: 'openid profile email accounting.contacts accounting.transactions offline_access'.split(' '),
});

async function initializeXero() {
  try {
    let tokenSet;
    // In Vercel, the filesystem is ephemeral. We prioritize env var, but try file as a fallback.
    if (process.env.XERO_TOKEN_SET) {
      console.log('Loading XERO_TOKEN_SET from environment variable.');
      // CRITICAL FIX: Sanitize the token set string before parsing
      const tokenSetString = process.env.XERO_TOKEN_SET.trim();
      tokenSet = JSON.parse(tokenSetString);
    } else {
      console.log('Attempting to read token set from file...');
      const storedToken = await fs.readFile(tokenPath, 'utf8');
      tokenSet = JSON.parse(storedToken);
      console.log('Successfully loaded token set from file.');
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
