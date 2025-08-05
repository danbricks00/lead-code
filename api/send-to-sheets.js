

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const leadData = req.body;
    console.log('✅ Lead received:', leadData);

    // For now, just log the data and return success
    // This ensures the chatbot works while we set up the integrations
    
    const response = {
      success: true,
      message: 'Lead submitted successfully! We have received your request.',
      data: leadData,
      timestamp: new Date().toISOString(),
      status: {
        logged: true,
        sheetsUpdated: false,
        customerEmailSent: false,
        tradesmanEmailSent: false,
        note: 'Environment variables need to be configured for full functionality'
      }
    };

    console.log('📊 Response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ Error processing lead:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process lead',
      details: error.message 
    });
  }
} 