import { addTradesman, getTradesmanByEmail } from './database.js';

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
    const { email, tradeType, businessName, phone, location } = req.body;
    console.log('📝 Registration request for:', email);

    if (!email || !tradeType || !businessName) {
      return res.status(400).json({
        success: false,
        error: 'Email, trade type, and business name are required'
      });
    }

    // Check if user is already registered
    const existingTradesman = await getTradesmanByEmail(email);
    
    if (existingTradesman) {
      console.log('⚠️ User already registered:', existingTradesman);
      return res.json({
        success: false,
        alreadyRegistered: true,
        error: 'User is already registered',
        user: existingTradesman
      });
    }

    // Create new tradesman
    const newTradesman = {
      email: email,
      name: email.split('@')[0], // Use email prefix as name if not provided
      tradeType: tradeType,
      businessName: businessName,
      phone: phone || '',
      location: location || '',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    // Add to database
    const addedTradesman = await addTradesman(newTradesman);
    
    if (addedTradesman) {
      console.log('✅ Tradesman registered successfully:', addedTradesman);
      return res.json({
        success: true,
        message: 'Registration successful',
        user: addedTradesman
      });
    } else {
      console.log('❌ Failed to add tradesman to database');
      return res.status(500).json({
        success: false,
        error: 'Failed to save registration'
      });
    }

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
} 