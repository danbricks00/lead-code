export default function handler(req, res) {
  console.log('🔍 Test API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({
      success: true,
      message: 'Test API is working!',
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    return res.json({
      success: true,
      message: 'Test API POST is working!',
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
