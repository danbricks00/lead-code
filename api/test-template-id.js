export default async function handler(req, res) {
  console.log('🔍 Testing template ID environment variable...');
  
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
      const templateId = process.env.GOOGLE_DOCS_TEMPLATE_ID;
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY;
      
      const status = {
        templateId: templateId ? '✅ Set' : '❌ NOT SET',
        clientEmail: clientEmail ? '✅ Set' : '❌ NOT SET',
        privateKey: privateKey ? '✅ Set' : '❌ NOT SET',
        templateIdValue: templateId || 'Not configured'
      };

      console.log('📊 Environment Status:', status);
      
      return res.status(200).json({
        success: true,
        message: 'Environment variables check complete',
        status: status,
        instructions: templateId ? 
          'Template ID is set. Try testing PDF generation.' : 
          'Please add GOOGLE_DOCS_TEMPLATE_ID to Vercel environment variables with value: 1jmcEgI6o8XS1KAgOyoWrx2xtuzU9v7y5'
      });

    } catch (error) {
      console.error('❌ Error checking environment:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check environment variables',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
