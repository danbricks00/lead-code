// Combined authentication API
export default function handler(req, res) {
  const { method, query } = req;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Route based on query parameters
  if (query.status) {
    return handleAuthStatus(req, res);
  } else if (query.register) {
    return handleRegister(req, res);
  } else if (method === 'POST') {
    return handleGoogleAuth(req, res);
  } else {
    return res.status(404).json({ error: 'Route not found' });
  }
}

function handleGoogleAuth(req, res) {
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
  try {
    res.json({ authenticated: false });
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ error: 'Failed to check authentication status' });
  }
}

function handleRegister(req, res) {
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