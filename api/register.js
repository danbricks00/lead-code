// Registration endpoint
import { addUser, findUserByEmail } from './database.js';

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
    const { email, tradeType, businessName, phone, location } = req.body;
    
    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.json({ 
        success: false, 
        message: 'User already registered. Please sign in with Google.',
        user: existingUser
      });
    }
    
    // Add new user
    const newUser = addUser({ email, tradeType, businessName, phone, location });
    
    res.json({ 
      success: true, 
      message: 'Registration successful! Please sign in with Google.',
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
} 