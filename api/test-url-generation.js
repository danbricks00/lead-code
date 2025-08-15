export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const SITE_URL = process.env.SITE_URL;
    const quoteId = 'QUOTE-1234567890-abc123';
    const leadId = 'LEAD-1234567890-abc123';
    const token = 'test-token';

    // Test different URL generation methods
    const origin1 = SITE_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const origin2 = SITE_URL || `https://${req.headers.host}`;
    const origin3 = SITE_URL || `http://${req.headers.host}`;

    const testUrls = {
      headers: {
        host: req.headers.host,
        'x-forwarded-proto': req.headers['x-forwarded-proto'],
        'x-forwarded-host': req.headers['x-forwarded-host'],
        'x-real-ip': req.headers['x-real-ip']
      },
      environment: {
        SITE_URL: SITE_URL,
        NODE_ENV: process.env.NODE_ENV
      },
      urlGeneration: {
        method1: origin1,
        method2: origin2,
        method3: origin3
      },
      generatedUrls: {
        onlineQuoteUrl1: `${origin1}/quote.html?quoteId=${encodeURIComponent(quoteId)}&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}`,
        onlineQuoteUrl2: `${origin2}/quote.html?quoteId=${encodeURIComponent(quoteId)}&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}`,
        onlineQuoteUrl3: `${origin3}/quote.html?quoteId=${encodeURIComponent(quoteId)}&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}`
      }
    };

    return res.status(200).json({
      success: true,
      data: testUrls
    });

  } catch (error) {
    console.error('❌ Error in URL generation test:', error);
    return res.status(500).json({
      error: 'Failed to test URL generation',
      details: error.message
    });
  }
}
