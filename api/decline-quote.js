export default async function handler(req, res) {
  console.log('❌ Decline Quote API called:', req.method, req.url);
  
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
      
      console.log('❌ Quote declined:', { quoteId, quoteNumber });

      // TODO: Update quote status in database
      // TODO: Send notification emails
      // TODO: Log the decline reason

      // Return decline page
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Quote Declined</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                .info { background: #f8f9fa; color: #0c5460; padding: 20px; border-radius: 8px; border: 1px solid #bee5eb; }
                .contact { background: #fff3cd; color: #856404; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7; margin: 20px 0; }
                .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
            </style>
        </head>
        <body>
            <div class="info">
                <h1>📋 Quote Declined</h1>
                <p><strong>Quote Number:</strong> ${quoteNumber}</p>
                <p>Thank you for your response. We understand that this quote may not have met your requirements.</p>
            </div>
            
            <div class="contact">
                <h3>Need to discuss further?</h3>
                <p>If you'd like to discuss alternative options or have any questions, please don't hesitate to contact us:</p>
                <p><strong>Phone:</strong> 021 123 456</p>
                <p><strong>Email:</strong> info@kiwiunderfloorheating.co.nz</p>
            </div>
            
            <div class="info">
                <h3>We're here to help!</h3>
                <p>We're committed to finding the right solution for your underfloor heating needs. Feel free to reach out anytime.</p>
            </div>
            
            <a href="https://lead-code.vercel.app/" class="button">Back to Home</a>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);

    } catch (error) {
      console.error('❌ Error declining quote:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to decline quote',
        details: error.message
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
