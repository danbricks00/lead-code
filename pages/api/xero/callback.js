import { XeroClient } from 'xero-node';

export default async function handler(req, res) {
  try {
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

    const url = req.url;
    const tokenSet = await xero.apiCallback(url);
    
    console.log('--- FRESH XERO TOKEN SET (COPY THIS ENTIRE OBJECT) ---');
    console.log(JSON.stringify(tokenSet, null, 2));
    console.log('----------------------------------------------------');

    // Store the token set for automatic refresh
    try {
      const { storeXeroTokenSet } = await import('../../../lib/xeroDirectApi.js');
      await storeXeroTokenSet(tokenSet);
      console.log('✅ Token set stored for automatic refresh');
    } catch (storeError) {
      console.error('❌ Failed to store token set:', storeError);
    }

    await xero.setTokenSet(tokenSet);
    const tenants = await xero.updateTenants();

    res.status(200).send(`
      <html>
        <head>
          <title>Xero Connection Successful</title>
          <style>
            body { font-family: sans-serif; padding: 2em; }
            pre { background-color: #f4f4f4; padding: 1em; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <h1>Xero Connection Successful!</h1>
          <p>Please copy the entire JSON object below and update the <strong>XERO_TOKEN_SET</strong> environment variable in your Vercel project settings.</p>
          <h2>Your New Xero Token Set:</h2>
          <pre>${JSON.stringify(tokenSet, null, 2)}</pre>
          <p><em>This token is also logged in your Vercel function logs.</em></p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('--- Xero Callback Error ---');
    console.error(error.response ? JSON.stringify(error.response.body, null, 2) : error);
    res.status(500).send('An error occurred during the Xero callback. Please check server logs.');
  }
}
