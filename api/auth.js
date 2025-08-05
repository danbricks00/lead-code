// Combined authentication API
export default function handler(req, res) {
  const { method, url } = req;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Route based on URL path
  if (url.includes('/auth/google')) {
    return handleGoogleAuth(req, res);
  } else if (url.includes('/auth/status')) {
    return handleAuthStatus(req, res);
  } else if (url.includes('/auth/register')) {
    return handleRegister(req, res);
  } else {
    return res.status(404).json({ error: 'Route not found' });
  }
}

function handleGoogleAuth(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { credential } = req.body;
    
    res.json({ 
      success: false, 
      needsRegistration: true,
      message: 'Please complete registration first'
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
}

function handleAuthStatus(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    res.json({ authenticated: false });
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ error: 'Failed to check authentication status' });
  }
}

function handleRegister(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tradeType, businessName, phone, location } = req.body;
    
    res.json({ 
      success: true, 
      message: 'Registration successful! Please sign in with Google.',
      user: {
        tradeType,
        businessName,
        phone,
        location,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
} 