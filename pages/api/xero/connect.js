import xero from '../../../lib/xero';

export default async function handler(req, res) {
  console.log('Attempting to build Xero consent URL...');
  try {
    const consentUrl = await xero.buildConsentUrl();
    console.log('Successfully built Xero consent URL. Redirecting...');
    res.redirect(consentUrl);
  } catch (error) {
    console.error('--- XERO CONNECTION ERROR ---');
    console.error('Failed to build Xero consent URL. This usually means a configuration issue.');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Full Error Object:', JSON.stringify(error, null, 2));
    console.error('-----------------------------');
    res.status(500).send('Failed to connect to Xero. Please check server logs for detailed error information.');
  }
}
