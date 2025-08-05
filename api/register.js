import { addTradesman, getTradesmanByEmail } from './database.js';

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
    const { email, name, tradeType } = req.body;
    console.log('📝 Registration request:', { email, name, tradeType });

    // Check if tradesman already exists
    const existingTradesman = getTradesmanByEmail(email);
    if (existingTradesman) {
      return res.json({
        success: false,
        error: 'Tradesman already registered',
        tradesman: existingTradesman
      });
    }

    // Add new tradesman
    const newTradesman = {
      email,
      name,
      tradeType,
      registeredAt: new Date().toISOString()
    };

    addTradesman(newTradesman);
    console.log('✅ Tradesman registered:', newTradesman);

    res.json({
      success: true,
      message: 'Tradesman registered successfully',
      tradesman: newTradesman
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register tradesman',
      details: error.message
    });
  }
} 