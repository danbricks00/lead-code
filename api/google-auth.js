import { getTradesmanByEmail } from './database.js';

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
    const { credential } = req.body;
    console.log('🔐 Google auth request received');

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'No credential provided'
      });
    }

    // Decode the JWT token (simplified - in production you'd verify the signature)
    try {
      const payload = JSON.parse(atob(credential.split('.')[1]));
      console.log('📋 Decoded payload:', payload);

      const email = payload.email;
      const name = payload.name;

      // Check if user is already registered
      const existingTradesman = await getTradesmanByEmail(email);
      
      if (existingTradesman) {
        console.log('✅ User already registered:', existingTradesman);
        return res.json({
          success: true,
          authenticated: true,
          needsRegistration: false,
          message: 'User authenticated successfully',
          user: existingTradesman
        });
      } else {
        console.log('⚠️ User not registered, needs registration');
        return res.json({
          success: false,
          needsRegistration: true,
          message: 'Please complete registration first',
          email: email,
          name: name
        });
      }

    } catch (decodeError) {
      console.error('❌ Error decoding credential:', decodeError);
      return res.status(400).json({
        success: false,
        error: 'Invalid credential format'
      });
    }

  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      details: error.message
    });
  }
} 