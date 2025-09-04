import xero from '../../../lib/xero';

// This is a one-time use endpoint to get the token.
// In a real multi-tenant app, you'd store this token set against a user account.
// For this single-business use case, we'll log it and store it as an environment variable.
export default async function handler(req, res) {
  try {
    const url = req.url;
    const tokenSet = await xero.apiCallback(url);
    
    // Log the token set. The user needs to copy this entire JSON object.
    console.log('XERO TOKEN SET (COPY THIS ENTIRE OBJECT):');
    console.log(JSON.stringify(tokenSet, null, 2));

    await xero.setTokenSet(tokenSet);

    // You can optionally get tenant info here to confirm connection
    const tenants = await xero.updateTenants();
    const activeTenant = tenants[0];

    console.log(`Successfully connected to Xero organization: ${activeTenant.tenantName}`);

    res.status(200).send(`
      <h1>Xero Connection Successful!</h1>
      <p>Successfully connected to <strong>${activeTenant.tenantName}</strong>.</p>
      <p>The Xero Token Set has been logged to your Vercel function logs.</p>
      <p>Please copy the entire JSON object from the logs and save it as a new environment variable in Vercel called <strong>XERO_TOKEN_SET</strong>.</p>
      <p>You can now close this window.</p>
    `);
  } catch (error) {
    console.error('Xero callback error:', error);
    res.status(500).send('An error occurred during the Xero callback. Please check server logs.');
  }
}
