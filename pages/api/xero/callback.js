import { xero } from '../../../lib/xero';

export default async function handler(req, res) {
  try {
    const url = req.url;
    const tokenSet = await xero.apiCallback(url);
    
    console.log('--- FRESH XERO TOKEN SET (COPY THIS ENTIRE OBJECT) ---');
    console.log(JSON.stringify(tokenSet, null, 2));
    console.log('----------------------------------------------------');

    await xero.setTokenSet(tokenSet);
    const tenants = await xero.updateTenants();
    const activeTenant = tenants[0];

    res.status(200).send(`
      <h1>Xero Connection Successful!</h1>
      <p>A fresh Xero Token Set has been logged to your Vercel function logs.</p>
      <p>Please copy the entire JSON object from the logs and update the <strong>XERO_TOKEN_SET</strong> environment variable in Vercel.</p>
    `);
  } catch (error) {
    console.error('--- Xero Callback Error ---');
    console.error(error.response ? JSON.stringify(error.response.body, null, 2) : error);
    res.status(500).send('An error occurred during the Xero callback. Please check server logs.');
  }
}
