import xero from '../../../lib/xero';

export default async function handler(req, res) {
  try {
    const consentUrl = await xero.buildConsentUrl();
    res.redirect(consentUrl);
  } catch (error) {
    console.error('Failed to build Xero consent URL:', error);
    res.status(500).send('Failed to connect to Xero. Please check server logs.');
  }
}
