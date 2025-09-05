import { XeroClient } from 'xero-node';

export default async function handler(req, res) {
  try {
    console.log('Building Xero consent URL...');
    
    const xero = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUris: [`${process.env.NEXT_PUBLIC_BASE_URL}/api/xero/callback`],
      scopes: [
        'openid',
        'profile', 
        'email',
        'accounting.contacts',
        'accounting.transactions',
        'accounting.settings.read',
        'offline_access'
      ]
    });

    const consentUrl = await xero.buildConsentUrl();
    console.log('Xero consent URL built successfully:', consentUrl);
    
    res.redirect(consentUrl);
  } catch (error) {
    console.log('--- XERO CONNECTION ERROR ---');
    console.log('Failed to build Xero consent URL. This usually means a configuration issue.');
    console.log('Error Name:', error.constructor.name);
    console.log('Error Message:', error.message);
    console.log('Full Error Object:', error);
    console.log('-----------------------------');
    
    res.status(500).send('Failed to connect to Xero. Please check server logs for detailed error information.');
  }
}
