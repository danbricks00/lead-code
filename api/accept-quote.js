export default async function handler(req, res) {
  console.log('✅ Accept Quote API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { quoteId, quoteNumber } = req.query;
      
      console.log('✅ Quote accepted:', { quoteId, quoteNumber });

      // TODO: Update quote status in database
      // TODO: Send confirmation emails
      // TODO: Create invoice in Xero

      // Return success page
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Quote Accepted</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                .success { background: #d4edda; color: #155724; padding: 20px; border-radius: 8px; border: 1px solid #c3e6cb; }
                .info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
            </style>
        </head>
        <body>
            <div class="success">
                <h1>🎉 Quote Accepted!</h1>
                <p><strong>Quote Number:</strong> ${quoteNumber}</p>
                <p>Thank you for accepting this quote. We'll be in touch soon to proceed with your project.</p>
            </div>
            
            <div class="info">
                <h3>What happens next?</h3>
                <ul style="text-align: left;">
                    <li>We'll contact you to confirm the details</li>
                    <li>Schedule the work at your convenience</li>
                    <li>Begin the installation process</li>
                    <li>Keep you updated throughout the project</li>
                </ul>
            </div>
            
            <a href="https://lead-code.vercel.app/" class="button">Back to Home</a>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);

    } catch (error) {
      console.error('❌ Error accepting quote:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to accept quote',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
