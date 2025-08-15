export default async function handler(req, res) {
  try {
    const { quoteId, leadId, token, action } = req.query;
    if (!quoteId || !leadId || !token || !['accept','decline'].includes(action)) {
      return res.status(400).send('Invalid request');
    }

    // TODO: verify token (HMAC) for leadId/quoteId here
    // await verifyToken({ leadId, token });

    // Update status in your storage (Sheet/DB)
    // await setQuoteStatus({ quoteId, leadId, status: action === 'accept' ? 'ACCEPTED' : 'DECLINED' });

    const title = action === 'accept' ? 'Quote Accepted' : 'Quote Declined';
    const msg = action === 'accept'
      ? 'Thanks! We have recorded your acceptance. We will be in touch shortly.'
      : 'Thanks for letting us know. We have recorded your decision.';

    // Optionally send notifications to admin/tradesman here

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!doctype html>
      <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${title}</title></head>
      <body style="font-family:Arial,sans-serif;padding:20px;">
        <h2>${title}</h2>
        <p>${msg}</p>
      </body></html>
    `);
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
}
