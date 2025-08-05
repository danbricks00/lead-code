// Google authentication endpoint
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { credential } = req.body;
    
    // For now, return a simple response
    // In production, you should verify the Google token
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