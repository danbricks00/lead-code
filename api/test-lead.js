export default function handler(req, res) {
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
    console.log('Test lead received:', leadData);

    // Simulate processing time
    setTimeout(() => {
      res.json({ 
        success: true, 
        message: 'Test lead received successfully!',
        data: leadData,
        timestamp: new Date().toISOString()
      });
    }, 1000);

  } catch (error) {
    console.error('Error processing test lead:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process test lead',
      details: error.message 
    });
  }
} 