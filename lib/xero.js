import { XeroClient } from 'xero-node';

console.log('Initializing Xero client...');
console.log(`XERO_CLIENT_ID: ${process.env.XERO_CLIENT_ID ? 'Loaded' : 'MISSING!'}`);
const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/xero/callback`;
console.log(`Xero Redirect URI configured as: ${redirectUri}`);


const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/xero/callback`
  ],
  scopes: 'openid profile email accounting.contacts accounting.transactions offline_access'.split(' '),
});

export default xero;
