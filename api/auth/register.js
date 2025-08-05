// Registration endpoint
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tradeType, businessName, phone, location } = req.body;
    
    // For now, return success
    // In production, you would save to database
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